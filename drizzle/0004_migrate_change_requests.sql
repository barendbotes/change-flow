-- First, get the IT Change Request type ID
DO $$ 
DECLARE
    change_request_type_id text;
BEGIN
    SELECT id INTO change_request_type_id FROM request_types WHERE name = 'IT Change Request';
    
    -- Migrate change requests to the main requests table
    INSERT INTO requests (
        id,
        title,
        description,
        user_id,
        request_type_id,
        data,
        status,
        created_at,
        updated_at
    )
    SELECT 
        cr.id,
        cr.title,
        cr.description,
        cr.user_id,
        change_request_type_id,
        jsonb_build_object(
            'changeType', cr.change_type,
            'priority', cr.priority,
            'implementationDate', cr.implementation_date,
            'impact', cr.impact,
            'rollbackPlan', cr.rollback_plan
        ),
        cr.status,
        cr.created_at,
        cr.updated_at
    FROM change_requests cr;

    -- Migrate change request approvals to the main approvals table
    INSERT INTO approvals (
        id,
        request_id,
        approver_id,
        status,
        notes,
        created_at,
        updated_at
    )
    SELECT 
        cra.id,
        cra.request_id,
        cra.approver_id,
        cra.status,
        cra.notes,
        cra.created_at,
        cra.updated_at
    FROM change_request_approvals cra;

    -- Migrate attachments from change requests to the main attachments table
    INSERT INTO attachments (
        id,
        request_id,
        file_name,
        file_url,
        file_size,
        file_type,
        created_at
    )
    SELECT 
        gen_random_uuid(),
        cr.id,
        jsonb_array_elements_text(cr.attachments::jsonb)::text,
        jsonb_array_elements_text(cr.attachments::jsonb)::text,
        NULL,
        NULL,
        cr.created_at
    FROM change_requests cr
    WHERE cr.attachments IS NOT NULL AND cr.attachments != '[]';
END $$;

-- Drop the redundant tables
DROP TABLE IF EXISTS change_request_approvals;
DROP TABLE IF EXISTS change_requests; 