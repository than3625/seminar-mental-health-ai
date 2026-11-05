package com.seminar.mentalhealth.service;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DocumentIngestionService {
    final EmbeddingModel embeddingModel;
    final EmbeddingStore<TextSegment> embeddingStore;

    @Value("${rag.pipeline.path:../rag_pipeline}")
    private String ragPipelinePath;

    public void ingestProcessedDocuments() {
        System.out.println("Bắt đầu nạp tài liệu từ thư mục processed_documents...");

        Path basePipelineDir = Paths.get(ragPipelinePath).toAbsolutePath().normalize();
        File processedDir = basePipelineDir.resolve("processed_documents").toFile();
        File metadataCsv = basePipelineDir.resolve("raw_documents").resolve("metadata.csv").toFile();

        // 1. Đọc toàn bộ cấu hình từ metadata.csv vào bộ nhớ
        Map<String, Map<String, String>> metadataMap = loadCsvMetadata(metadataCsv);

        DocumentSplitter documentSplitter = DocumentSplitters.recursive(500, 50);
        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .documentSplitter(documentSplitter)
                .embeddingModel(embeddingModel)
                .embeddingStore(embeddingStore)
                .build();

        // 2. Quét các file .txt trong processed_documents
        if (processedDir.exists() && processedDir.listFiles() != null) {
            for (File file : processedDir.listFiles()) {
                if (file.isFile() && file.getName().endsWith(".txt")) {

                    // Nạp nội dung file
                    Document document = FileSystemDocumentLoader.loadDocument(file.toPath());

                    // 3. Tìm metadata tương ứng với tên file và gán vào document
                    Map<String, String> fileMetadata = metadataMap.get(file.getName());
                    if (fileMetadata != null) {
                        fileMetadata.forEach((key, value) -> document.metadata().put(key, value));
                    } else {
                        System.out.println("Cảnh báo: Không tìm thấy dòng metadata cho file " + file.getName());
                    }

                    // 4. Nhúng và lưu vào PostgreSQL
                    ingestor.ingest(document);
                    System.out.println("Đã nạp và dán nhãn thành công file: " + file.getName());
                }
            }
        }
        System.out.println("Hoàn tất nạp dữ liệu từ pipeline!");
    }

    private Map<String, Map<String, String>> loadCsvMetadata(File csvFile) {
        Map<String, Map<String, String>> map = new HashMap<>();

        if (!csvFile.exists()) {
            System.err.println("Cảnh báo: Không tìm thấy file metadata.csv tại " + csvFile.getAbsolutePath());
            return map;
        }

        try (BufferedReader br = new BufferedReader(new FileReader(csvFile))) {
            String headerLine = br.readLine();
            if (headerLine == null) return map;

            String[] headers = headerLine.split(",");

            String line;
            while ((line = br.readLine()) != null) {
                String[] values = line.split(",", -1);
                Map<String, String> rowMeta = new HashMap<>();
                String originalFileName = "";

                for (int i = 0; i < headers.length; i++) {
                    if (i < values.length) {
                        String key = headers[i].trim();
                        String value = values[i].trim();
                        rowMeta.put(key, value);

                        if (key.equals("file_name")) {
                            originalFileName = value;
                        }
                    }
                }

                if (!originalFileName.isEmpty() && originalFileName.contains(".")) {
                    String processedFileName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) + ".txt";
                    map.put(processedFileName, rowMeta);
                }
            }
        } catch (IOException e) {
            System.err.println("Lỗi khi đọc file metadata.csv: " + e.getMessage());
        }
        return map;
    }

    public void ingestUploadedDocument(MultipartFile file, String title, String publisher, String url,
                                       String language, String docType, String topic,
                                       String recLevel, String accessedAt) throws Exception {

        System.out.println("Đang xử lý file upload từ Admin: " + file.getOriginalFilename());
        String originalFileName = file.getOriginalFilename();

        Path basePipelineDir = Paths.get(ragPipelinePath).toAbsolutePath().normalize();

        // 1. Lưu file thô vào thư mục raw_documents
        Path rawFilePath = basePipelineDir.resolve("raw_documents").resolve(originalFileName);
        file.transferTo(rawFilePath.toFile());

        // 2. Ghi thêm dữ liệu vào metadata.csv
        Path metadataCsvPath = basePipelineDir.resolve("raw_documents").resolve("metadata.csv");
        String sourceId = UUID.randomUUID().toString().substring(0, 8);

        String newCsvLine = String.format("%n%s,%s,%s,%s,%s,%s,%s,%s,%s,%s",
                sourceId, originalFileName, title, publisher, url, language, docType, topic, recLevel, accessedAt);
        Files.write(metadataCsvPath, newCsvLine.getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);

        // 3. Tự động kích hoạt script clean_data.py
        System.out.println("Đang gọi script Python làm sạch dữ liệu...");

        // Kiểm tra đường dẫn python trên Windows (.venv/Scripts/python.exe) hoặc Linux/Mac (.venv/bin/python)
        Path pythonExePath = basePipelineDir.resolve(".venv").resolve("Scripts").resolve("python.exe");
        if (!Files.exists(pythonExePath)) {
            pythonExePath = basePipelineDir.resolve(".venv").resolve("bin").resolve("python");
        }
        String pythonExe = Files.exists(pythonExePath) ? pythonExePath.toString() : "python";

        String scriptPath = basePipelineDir.resolve("scripts").resolve("clean_data.py").toString();
        if (!Files.exists(Paths.get(scriptPath))) {
            // Dự phòng trường hợp clean_data.py nằm ngay thư mục gốc rag_pipeline/
            scriptPath = basePipelineDir.resolve("clean_data.py").toString();
        }

        ProcessBuilder pb = new ProcessBuilder(pythonExe, scriptPath);
        pb.directory(basePipelineDir.toFile());
        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Lỗi khi chạy script Python clean_data.py! Mã lỗi: " + exitCode);
        }

        // 4. Đọc file .txt đã làm sạch từ processed_documents và nạp vào Vector DB
        String processedFileName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) + ".txt";
        Path processedFilePath = basePipelineDir.resolve("processed_documents").resolve(processedFileName);

        if (!Files.exists(processedFilePath)) {
            throw new RuntimeException("Không tìm thấy file đã xử lý: " + processedFileName);
        }

        Document document = FileSystemDocumentLoader.loadDocument(processedFilePath);

        // Gắn đầy đủ metadata cho các chunk
        document.metadata().put("source_id", sourceId);
        document.metadata().put("file_name", originalFileName);
        document.metadata().put("title", title);
        document.metadata().put("publisher", publisher);
        document.metadata().put("url", url);
        document.metadata().put("language", language);
        document.metadata().put("doc_type", docType);
        document.metadata().put("topic", topic);
        document.metadata().put("recommendation_level", recLevel);
        document.metadata().put("accessed_at", accessedAt);

        // Tiến hành cắt và nhúng
        DocumentSplitter documentSplitter = DocumentSplitters.recursive(500, 50);
        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .documentSplitter(documentSplitter)
                .embeddingModel(embeddingModel)
                .embeddingStore(embeddingStore)
                .build();

        ingestor.ingest(document);
        System.out.println("Nạp thành công file vào Vector DB: " + processedFileName);
    }
}