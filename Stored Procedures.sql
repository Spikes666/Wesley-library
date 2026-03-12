CREATE OR REPLACE PROCEDURE populate_all_checkouts_from_books()
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    INSERT INTO CHECKOUTS_WESLEY (
        ISBN,
        ACTION,
        CHECKED_OUT_BY,
        CHECKED_OUT_AT,
        NOTES
    )
    SELECT
        ISBN,
        'inventory_load',
        CURRENT_USER(),
        CURRENT_TIMESTAMP(),
        'Initial load of all ISBNs from BOOKS_WESLEY'
    FROM BOOKS_WESLEY;

    RETURN 'All ISBNs inserted into CHECKOUTS_WESLEY.';
END;
$$;


CREATE OR REPLACE PROCEDURE populate_missing_checkouts()
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    INSERT INTO CHECKOUTS_WESLEY (
        ISBN,
        ACTION,
        CHECKED_OUT_BY,
        CHECKED_OUT_AT,
        NOTES
    )
    SELECT
        b.ISBN,
        'inventory_load',
        CURRENT_USER(),
        CURRENT_TIMESTAMP(),
        'Inserted missing ISBN from BOOKS_WESLEY'
    FROM BOOKS_WESLEY b
    WHERE b.ISBN NOT IN (
        SELECT DISTINCT ISBN FROM CHECKOUTS_WESLEY
    );

    RETURN 'Missing ISBNs inserted into CHECKOUTS_WESLEY.';
END;
$$;


CALL populate_all_checkouts_from_books();
-- or
CALL populate_missing_checkouts();
