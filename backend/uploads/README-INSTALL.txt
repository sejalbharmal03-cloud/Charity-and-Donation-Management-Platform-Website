CareConnect demo files — SAMPLE ONLY

Copy PDF files from documents/ to:
backend/uploads/documents/

Copy JPG files from gallery/ to:
backend/uploads/gallery/

If your server uses app.use('/uploads', express.static(...)), suggested URLs:
PDF: /uploads/documents/annual-report-2021-22-SAMPLE.pdf (and equivalent years)
Images: /uploads/gallery/food-distribution-SAMPLE.jpg
         /uploads/gallery/education-support-SAMPLE.jpg
         /uploads/gallery/community-service-SAMPLE.jpg

Then update annual_reports.file_url and gallery_photos.image_url to those exact paths.
These are fictional sample files, not official reports or certificates.
