-- Create enum type for Mahasiswa.jurusan options
CREATE TYPE "Jurusan" AS ENUM (
  'REKAYASA_PERANGKAT_LUNAK',
  'STATISTIK',
  'SAINS_AKTUARIA',
  'MANAJEMEN_RETAIL'
);

-- Convert existing TEXT jurusan column to enum safely.
ALTER TABLE "Mahasiswa"
ALTER COLUMN "jurusan" TYPE "Jurusan"
USING CASE
  WHEN "jurusan" = 'rekayasa perangkat lunak' THEN 'REKAYASA_PERANGKAT_LUNAK'::"Jurusan"
  WHEN "jurusan" = 'statistik' THEN 'STATISTIK'::"Jurusan"
  WHEN "jurusan" = 'sains aktuaria' THEN 'SAINS_AKTUARIA'::"Jurusan"
  WHEN "jurusan" = 'manajemen retail' THEN 'MANAJEMEN_RETAIL'::"Jurusan"
  WHEN "jurusan" = 'menejemen retail' THEN 'MANAJEMEN_RETAIL'::"Jurusan"
  ELSE NULL
END;
