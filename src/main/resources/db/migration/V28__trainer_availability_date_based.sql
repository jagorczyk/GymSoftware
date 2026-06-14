-- Change trainer_availabilities to use specific dates instead of recurring day_of_week
ALTER TABLE trainer_availabilities DROP COLUMN IF EXISTS day_of_week;
ALTER TABLE trainer_availabilities ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
