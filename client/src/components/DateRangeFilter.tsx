import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar, X } from "lucide-react";

interface DateRangeFilterProps {
  onApply: (startDate?: Date, endDate?: Date) => void;
  onClear: () => void;
  isActive: boolean;
}

export default function DateRangeFilter({ onApply, onClear, isActive }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start && end && start > end) {
      alert("Start date must be before end date");
      return;
    }

    onApply(start, end);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onClear();
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`gap-2 ${isActive ? "border-blue-500 bg-blue-50" : ""}`}
      >
        <Calendar className="h-4 w-4" />
        Date Range Filter
        {isActive && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />}
      </Button>

      {isExpanded && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply} className="flex-1">
              Apply Filter
            </Button>
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {startDate && endDate && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Filtering trades from {new Date(startDate).toLocaleDateString()} to{" "}
              {new Date(endDate).toLocaleDateString()}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
