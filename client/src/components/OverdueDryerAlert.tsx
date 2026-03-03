import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { useLocation } from "wouter";

interface DryerEntry {
  id: number;
  binNo: number;
  organiser: string;
  variety: string;
  intakeQuantity: string;
  dateOfIntake: string;
  fiveDayDueDate: string;
  status: string;
}

function getDaysSinceIntake(dateOfIntake: string): number {
  const intake = new Date(dateOfIntake);
  const now = new Date();
  intake.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - intake.getTime()) / (1000 * 60 * 60 * 24));
}

export default function OverdueDryerAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [, navigate] = useLocation();

  const { data: entries } = useQuery<DryerEntry[]>({
    queryKey: ["/api/dryer"],
    refetchInterval: 5 * 60 * 1000,
  });

  const overdueEntries = (entries || []).filter(
    (e) => e.status === "intake" && getDaysSinceIntake(e.dateOfIntake) >= 5
  );

  useEffect(() => {
    if (overdueEntries.length > 0 && !dismissed) {
      setShowAlert(true);
    }
  }, [overdueEntries.length, dismissed]);

  if (overdueEntries.length === 0) return null;

  return (
    <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
      <AlertDialogContent className="max-w-lg" data-testid="dialog-overdue-dryer">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Overdue Dryer Entries
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm">
                {overdueEntries.length} dryer {overdueEntries.length === 1 ? "entry has" : "entries have"} exceeded the 5-day drying period and {overdueEntries.length === 1 ? "is" : "are"} still in Intake.
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {overdueEntries.map((entry) => {
                  const days = getDaysSinceIntake(entry.dateOfIntake);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                      data-testid={`overdue-entry-${entry.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          Bin {entry.binNo}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-foreground">{entry.variety || "No variety"}</p>
                          <p className="text-xs text-muted-foreground">{entry.organiser || "No organiser"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-destructive">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-sm font-semibold">{days} days</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => {
              setShowAlert(false);
              setDismissed(true);
              navigate("/dryer");
            }}
            data-testid="button-go-to-dryer"
          >
            Go to Dryer Page
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={() => {
              setShowAlert(false);
              setDismissed(true);
            }}
            data-testid="button-dismiss-overdue"
          >
            Dismiss
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
