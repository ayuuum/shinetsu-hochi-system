CREATE TABLE IF NOT EXISTS training_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_qualification_id UUID NOT NULL REFERENCES employee_qualifications(id) ON DELETE CASCADE,
    training_date DATE NOT NULL,
    training_type TEXT NOT NULL DEFAULT '初回',
    provider TEXT,
    certificate_number TEXT,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE training_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view training_history"
    ON training_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin and HR can insert training_history"
    ON training_history FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT get_user_role(auth.uid())) IN ('admin', 'hr')
    );

CREATE POLICY "Admin and HR can update training_history"
    ON training_history FOR UPDATE
    TO authenticated
    USING (
        (SELECT get_user_role(auth.uid())) IN ('admin', 'hr')
    );

CREATE POLICY "Admin and HR can delete training_history"
    ON training_history FOR DELETE
    TO authenticated
    USING (
        (SELECT get_user_role(auth.uid())) IN ('admin', 'hr')
    );
