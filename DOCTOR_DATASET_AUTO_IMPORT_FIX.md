# Doctor dataset auto-import fix

The bundled `data/doctors_dataset_all_departments.csv` is now also packaged inside `user-service/src/main/resources/data/`.

When the user service starts, `DoctorDatasetStartupImporter` reads that bundled CSV and imports/updates each doctor through the existing `UserService.importDoctorFromDataset` method. Records are matched by email, so repeated restarts update the same demo records rather than creating duplicates. Existing Admin CSV upload remains available.

After replacing the project, rebuild the services from the project root:

```powershell
docker compose up --build -d
```

Check the import result:

```powershell
docker compose logs --tail=150 user-service
```

Look for `Doctor dataset startup import finished`. Then sign out/in or refresh the Patient Find Doctors page. The dataset contains fictional demo doctor profiles; replace them with verified hospital data before production.

This package was not build-tested in this environment because Maven is unavailable here. If the build fails locally, share the exact Maven/Docker error.
