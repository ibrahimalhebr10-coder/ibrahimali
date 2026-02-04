/*
  # Fix Maintenance Media Storage - Make Bucket Public

  1. Changes
    - Make maintenance-media bucket public for client access
    - This fixes broken images in "My Green Trees" section
    
  2. Why
    - The bucket was private, causing getPublicUrl() to return invalid URLs
    - Clients need to see published maintenance photos
*/

UPDATE storage.buckets 
SET public = true 
WHERE name = 'maintenance-media';
