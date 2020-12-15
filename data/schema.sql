DROP TABLE IF EXISTS records;

CREATE TABLE IF NOT EXISTS records(
    id SERIAL PRIMARY KEY,
    Country VARCHAR(255),
    TotalConfirmed NUMERIC,
    TotalDeaths NUMERIC,
    TotalRecovered NUMERIC,
    Date Date
);