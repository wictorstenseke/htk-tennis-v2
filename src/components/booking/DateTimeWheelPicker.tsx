import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from "@/components/wheel-picker";

interface DateTimeWheelPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Date;
  onChange: (date: Date) => void;
  title: string;
}

const generateDateOptions = (): WheelPickerOption[] => {
  const options: WheelPickerOption[] = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];

    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const monthName = monthNames[date.getMonth()];

    options.push({
      label: `${dayName} ${day} ${monthName}`,
      value: date.toISOString().split("T")[0],
    });
  }

  return options;
};

const generateHourOptions = (): WheelPickerOption[] => {
  return Array.from({ length: 24 }, (_, i) => ({
    label: i.toString().padStart(2, "0"),
    value: i.toString(),
  }));
};

const generateMinuteOptions = (): WheelPickerOption[] => {
  return Array.from({ length: 4 }, (_, i) => {
    const minute = i * 15;
    return {
      label: minute.toString().padStart(2, "0"),
      value: minute.toString(),
    };
  });
};

export const DateTimeWheelPicker = ({
  open,
  onOpenChange,
  value,
  onChange,
  title,
}: DateTimeWheelPickerProps) => {
  const [selectedDate, setSelectedDate] = useState(
    value.toISOString().split("T")[0]
  );
  const [selectedHour, setSelectedHour] = useState(
    value.getHours().toString()
  );
  const [selectedMinute, setSelectedMinute] = useState(
    Math.floor(value.getMinutes() / 15) * 15
  );

  const dateOptions = generateDateOptions();
  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

  const handleConfirm = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(parseInt(selectedHour));
    newDate.setMinutes(selectedMinute);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <WheelPickerWrapper>
            <WheelPicker
              value={selectedDate}
              onValueChange={setSelectedDate}
              options={dateOptions}
            />
            <WheelPicker
              value={selectedHour}
              onValueChange={setSelectedHour}
              options={hourOptions}
            />
            <WheelPicker
              value={selectedMinute.toString()}
              onValueChange={(val: string) => setSelectedMinute(parseInt(val))}
              options={minuteOptions}
            />
          </WheelPickerWrapper>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
