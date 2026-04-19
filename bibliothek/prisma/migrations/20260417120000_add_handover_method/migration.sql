-- Add HandoverMethod enum and handover fields to Loan table
ALTER TABLE `loans`
  ADD COLUMN `handoverMethod`   ENUM('PICKUP', 'MEETINGPOINT', 'SHIPPING', 'DROPOFF') NULL,
  ADD COLUMN `handoverDate`     DATETIME(3) NULL,
  ADD COLUMN `handoverLocation` VARCHAR(500) NULL,
  ADD COLUMN `handoverCost`     DECIMAL(8, 2) NULL;
