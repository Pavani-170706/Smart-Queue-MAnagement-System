package com.qms.user;

import com.qms.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Imports bundled demo doctors on startup. Import is idempotent because UserService matches by email. */
@Component
@RequiredArgsConstructor
public class DoctorDatasetStartupImporter implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DoctorDatasetStartupImporter.class);
    private final UserService userService;

    @Override
    public void run(ApplicationArguments args) {
        int imported = 0;
        int failed = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("data/doctors_dataset_all_departments.csv").getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                log.warn("Doctor dataset is empty; startup import skipped.");
                return;
            }
            List<String> headers = parseCsvLine(headerLine.replace("\uFEFF", ""));
            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) continue;
                try {
                    List<String> values = parseCsvLine(line);
                    if (values.size() != headers.size()) throw new IllegalArgumentException("CSV column count mismatch");
                    Map<String, String> row = new LinkedHashMap<>();
                    for (int i = 0; i < headers.size(); i++) row.put(headers.get(i).trim(), values.get(i).trim());
                    userService.importDoctorFromDataset(row);
                    imported++;
                } catch (Exception ex) {
                    failed++;
                    log.error("Doctor dataset import failed at CSV line {}: {}", lineNumber, ex.getMessage());
                }
            }
            log.info("Doctor dataset startup import finished: {} rows imported/updated, {} rows failed.", imported, failed);
        } catch (Exception ex) {
            log.error("Could not load bundled doctor dataset; use Admin > Doctor Management to import CSV manually.", ex);
        }
    }

    private List<String> parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') { field.append('"'); i++; }
                else quoted = !quoted;
            } else if (c == ',' && !quoted) {
                fields.add(field.toString()); field.setLength(0);
            } else field.append(c);
        }
        if (quoted) throw new IllegalArgumentException("Unclosed quoted field");
        fields.add(field.toString());
        return fields;
    }
}
