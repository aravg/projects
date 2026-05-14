CREATE TABLE IF NOT EXISTS books (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    availability_status TEXT DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS borrowers (
    borrower_id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    borrower_id INTEGER NOT NULL,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    return_date DATETIME,
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id)
);

-- Sample data
INSERT OR IGNORE INTO books (title, author, category, isbn, availability_status) VALUES
('Clean Code', 'Robert C. Martin', 'Technology', '978-0132350884', 'available'),
('The Pragmatic Programmer', 'Andrew Hunt', 'Technology', '978-0201616224', 'available'),
('Design Patterns', 'Gang of Four', 'Technology', '978-0201633610', 'available'),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', '978-0061935466', 'available'),
('1984', 'George Orwell', 'Fiction', '978-0451524935', 'available');
