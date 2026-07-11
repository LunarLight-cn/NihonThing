
-- Insert Admin User
INSERT INTO Users (username, email, password_hash, role)
VALUES ('Admin', 'admin@nihonthing.com', '73cc5aaa24d355c2ef07a71d965661379c89c07ce3dbea36f6f52734fe0b88a1', 'admin');

-- Insert Customer User
INSERT INTO Users (username, email, password_hash, role)
VALUES ('John Doe', 'john@example.com', '448a56f2434d499a60173c7750d0e81a1f9d05d6b3578096177da3464cc2ad89', 'customer');
