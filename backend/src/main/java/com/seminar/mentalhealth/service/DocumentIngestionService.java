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
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DocumentIngestionService {
    EmbeddingModel embeddingModel;
    EmbeddingStore<TextSegment> embeddingStore;

    String RAG_PIPELINE_PATH = "C:/Users/ASUS/Desktop/mentalhealth/rag_pipeline";

    public void ingestProcessedDocuments() {
        System.out.println("Bắt đầu nạp tài liệu từ thư mục processed_documents...");

        File processedDir = new File(RAG_PIPELINE_PATH + "/processed_documents");
        File metadataCsv = new File(RAG_PIPELINE_PATH + "/raw_documents/metadata.csv");

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

        try (BufferedReader br = new BufferedReader(new FileReader(csvFile))) {
            String headerLine = br.readLine();
            if (headerLine == null) return map;

            // Lấy danh sách tên cột
            String[] headers = headerLine.split(",");

            String line;
            while ((line = br.readLine()) != null) {
                // Tách các giá trị bằng dấu phẩy
                String[] values = line.split(",", -1);
                Map<String, String> rowMeta = new HashMap<>();
                String originalFileName = "";

                // Gắn từng giá trị vào đúng tên cột
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

                // Xử lý logic chuyển đổi tên file (.pdf, .html -> .txt)
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

//    public void ingestDocuments() {
//        System.out.println("Bắt đầu nạp tài liệu vào Vector DB...");
//
//        // 1. Đọc file .txt từ thư mục
//        Path documentPath = Paths.get("C:/Users/ASUS/Desktop/mentalhealth/documents/tailieu.txt");
//        Document document = FileSystemDocumentLoader.loadDocument(documentPath);
//
//        // 2. Tạo máy cắt: Mỗi đoạn tối đa 500 token, gối lên nhau (overlap) 50 token để không mất ngữ nghĩa
//        DocumentSplitter documentSplitter = DocumentSplitters.recursive(500, 50);
//
//        // 3. Nạp vào kho
//        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
//                .documentSplitter(documentSplitter)
//                .embeddingModel(embeddingModel)
//                .embeddingStore(embeddingStore)
//                .build();
//
//        ingestor.ingest(document);
//
//        System.out.println("Nạp tài liệu thành công! Kho đã sẵn sàng.");
//    }
//
//    public void ingestAllDocuments() {
//        System.out.println("Bắt đầu quét và nạp tài liệu tự động");
//
//        // Đường dẫn tới thư mục gốc chứa các chủ đề
//        File rootDir = new File("C:/Users/ASUS/Desktop/documents");
//
//        // Cấu hình chunk
//        DocumentSplitter documentSplitter = DocumentSplitters.recursive(500, 50);
//
//        // Cấu hình máy nạp
//        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
//                .documentSplitter(documentSplitter)
//                .embeddingModel(embeddingModel)
//                .embeddingStore(embeddingStore)
//                .build();
//
//        // Quét qua từng thư mục chủ đề
//        if (rootDir.listFiles() != null) {
//            for (File categoryFolder : rootDir.listFiles()) {
//                if (categoryFolder.isDirectory()) {
//                    String topicName = categoryFolder.getName();
//
//                    // Quét từng file trong thư mục
//                    for (File file : categoryFolder.listFiles()) {
//                        if (file.isFile()) {
//                            // Load file lên
//                            Document document = FileSystemDocumentLoader.loadDocument(file.toPath());
//
//                            // Dán nhãn metadata cho toàn bộ file này
//                            document.metadata().put("topic", topicName);
//                            document.metadata().put("source_file", file.getName());
//
//                            // Đẩy vào kho. Máy nạp sẽ tự động chép các nhãn này xuống từng đoạn chunk nhỏ
//                            ingestor.ingest(document);
//                            System.out.println("Đã nạp xong file: " + file.getName() + " (Chủ đề: " + topicName + ")");
//                        }
//                    }
//                }
//            }
//        }
//        System.out.println("Hoàn tất nạp toàn bộ tài liệu vào Vector DB");
//    }

    public void ingestUploadedDocument(MultipartFile file, String title, String publisher, String url,
                                       String language, String docType, String topic,
                                       String recLevel, String accessedAt) throws Exception {

        System.out.println("Đang xử lý file upload từ Admin: " + file.getOriginalFilename());
        String originalFileName = file.getOriginalFilename();

        // 1. Lưu file thô vào thư mục raw_documents
        Path rawFilePath = Paths.get(RAG_PIPELINE_PATH, "raw_documents", originalFileName);
        file.transferTo(rawFilePath.toFile());

        // 2. Ghi thêm dữ liệu vào metadata.csv
        Path metadataCsvPath = Paths.get(RAG_PIPELINE_PATH, "raw_documents", "metadata.csv");
        String sourceId = UUID.randomUUID().toString().substring(0, 8);

        String newCsvLine = String.format("\n%s,%s,%s,%s,%s,%s,%s,%s,%s,%s",
                sourceId, originalFileName, title, publisher, url, language, docType, topic, recLevel, accessedAt);
        Files.write(metadataCsvPath, newCsvLine.getBytes(StandardCharsets.UTF_8), StandardOpenOption.APPEND);

        // 3. Tự động kích hoạt script clean_data.py
        System.out.println("Đang gọi script Python làm sạch dữ liệu...");
        String pythonExe = RAG_PIPELINE_PATH + "/.venv/Scripts/python.exe";
        String scriptPath = RAG_PIPELINE_PATH + "/scripts/clean_data.py";

        ProcessBuilder pb = new ProcessBuilder(pythonExe, scriptPath);
        pb.directory(new File(RAG_PIPELINE_PATH));
        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Lỗi khi chạy script Python clean_data.py! Mã lỗi: " + exitCode);
        }

        // 4. Đọc file .txt đã làm sạch từ processed_documents và nạp vào Vector DB
        String processedFileName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) + ".txt";
        Path processedFilePath = Paths.get(RAG_PIPELINE_PATH, "processed_documents", processedFileName);

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
