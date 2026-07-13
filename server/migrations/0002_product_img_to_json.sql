UPDATE Products
SET img = json_array(img)
WHERE img IS NOT NULL AND img != '' AND img NOT LIKE '[%';