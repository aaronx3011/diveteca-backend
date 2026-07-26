CREATE TABLE [desarrollo].[dbo].[patch_notes] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    published_at DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE [desarrollo].[dbo].[issue_reports] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_email VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_severity CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    CONSTRAINT CK_status CHECK (status IN ('open', 'in_review', 'resolved'))
);
