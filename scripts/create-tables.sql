-- Create QuizSessions table
CREATE TABLE IF NOT EXISTS QuizSessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    selected_channels TEXT NOT NULL
);

-- Create QuizResponses table
CREATE TABLE IF NOT EXISTS QuizResponses (
    response_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES QuizSessions(session_id),
    FOREIGN KEY (question_id) REFERENCES Questions(question_id),
    FOREIGN KEY (option_id) REFERENCES Options(option_id)
);

-- Create CalculationResults table
CREATE TABLE IF NOT EXISTS CalculationResults (
    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    awareness_score INTEGER NOT NULL,
    awareness_label TEXT NOT NULL,
    credibility_score INTEGER NOT NULL,
    credibility_label TEXT NOT NULL,
    communication_score INTEGER NOT NULL,
    communication_label TEXT NOT NULL,
    retention_score INTEGER NOT NULL,
    retention_label TEXT NOT NULL,
    engagement_score INTEGER NOT NULL,
    engagement_label TEXT NOT NULL,
    strategy_score INTEGER NOT NULL,
    strategy_label TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES QuizSessions(session_id)
);

-- Create FinalReports table
CREATE TABLE IF NOT EXISTS FinalReports (
    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    report_text TEXT NOT NULL,
    generated_timestamp TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES QuizSessions(session_id)
); 