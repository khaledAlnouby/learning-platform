Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd user-service; ./mvnw spring-boot:run" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd course-service; ./mvnw spring-boot:run" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd enrollment-service; ./mvnw spring-boot:run" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd notification-service; ./mvnw spring-boot:run" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "All services and frontend are starting up in separate windows..."
