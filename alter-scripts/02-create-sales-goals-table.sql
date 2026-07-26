CREATE TABLE [desarrollo].[dbo].[sales_goals] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    goal_amount DECIMAL(18,2) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_year_month UNIQUE (year, month),
    CONSTRAINT CK_month CHECK (month BETWEEN 1 AND 12)
);
