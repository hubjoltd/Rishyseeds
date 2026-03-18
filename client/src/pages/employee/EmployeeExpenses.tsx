import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Loader2, ChevronRight, Camera, CheckCircle,
  XCircle, Clock, Gauge, FileText, Banknote, Search, X, AlertCircle, Lock,
} from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface EmployeeExpensesProps {
  employee: { id: number; fullName: string; employeeId: string; workLocation?: string };
}

const EXPENSE_TYPES = [
  "LOCAL TRAVEL CLAIM",
  "FOOD & BEVERAGE",
  "ACCOMMODATION",
  "FUEL REIMBURSEMENT",
  "TELEPHONE / INTERNET",
  "STATIONERY / PRINTING",
  "PROMOTIONAL EXPENSE",
  "OTHER",
];

const TRAVEL_MODES = ["TAXICAB", "AUTO RICKSHAW", "BUS", "TRAIN", "FLIGHT", "OWN VEHICLE", "BIKE", "OTHER"];

function fmtDate(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
}

type TabKey = "pending" | "approved" | "rejected" | "all";
type View = "list" | "create" | "detail";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function PhotoBox({
  label, mandatory, preview, onCapture, onClear, disabled,
}: {
  label: string; mandatory?: boolean; preview: string | null;
  onCapture: () => void; onClear: () => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500 font-medium">
        {label} {mandatory && <span className="text-red-500">*</span>}
      </p>
      {preview ? (
        <div className="relative w-28 h-20">
          <img src={preview} alt={label} className="w-28 h-20 object-cover rounded-md border border-gray-200" />
          <button
            onClick={onClear}
            className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow border border-gray-200 p-0.5"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        </div>
      ) : (
        <button
          onClick={disabled ? undefined : onCapture}
          disabled={disabled}
          className={`w-28 h-20 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-1 transition-colors
            ${disabled ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50" : "border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500"}`}
        >
          <Camera className="h-5 w-5" />
          <span className="text-[10px]">{disabled ? "Locked" : "Capture"}</span>
        </button>
      )}
    </div>
  );
}

function ExpenseCommentSection({ expenseId, employeeName }: { expenseId: number; employeeName: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: ["/api/employee/expenses", expenseId, "comments"],
    queryFn: async () => {
      const r = await fetch(`/api/employee/expenses/${expenseId}/comments`, { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const r = await fetch(`/api/employee/expenses/${expenseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ message: text.trim(), createdByName: employeeName }),
      });
      if (!r.ok) throw new Error("Failed to send");
      return r.json();
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["/api/employee/expenses", expenseId, "comments"] });
    },
    onError: () => toast({ title: "Failed to send comment", variant: "destructive" }),
  });

  return (
    <div className="border border-amber-200 rounded-lg bg-amber-50 overflow-hidden">
      <div className="px-3 py-2 border-b border-amber-200 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">Pending Approval - Leave a Note</span>
      </div>
      {comments.length > 0 && (
        <div className="divide-y divide-amber-100 max-h-36 overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="px-3 py-2">
              <p className="text-[11px] font-semibold text-amber-700">{c.createdByName}</p>
              <p className="text-xs text-gray-700">{c.message}</p>
            </div>
          ))}
        </div>
      )}
      <div className="px-3 py-2 flex items-end gap-2 border-t border-amber-100">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="flex-1 bg-white border border-amber-200 rounded-md px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
          data-testid="input-expense-comment"
        />
        <button
          onClick={() => text.trim() && sendMutation.mutate()}
          disabled={!text.trim() || sendMutation.isPending}
          className="h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center shrink-0 transition-colors"
          data-testid="button-send-expense-comment"
        >
          {sendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <FileText className="h-3.5 w-3.5 text-white" />}
        </button>
      </div>
    </div>
  );
}

function FareRow({
  label, value, onChange, placeholder, remarks, onRemarksChange, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  remarks?: string;
  onRemarksChange?: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 w-36 shrink-0 font-medium">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₹</span>
          <input
            type="number"
            min="0"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || "0"}
            className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400"
          />
        </div>
      </div>
      {onRemarksChange !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-36 shrink-0">Remarks</span>
          <input
            type="text"
            value={remarks ?? ""}
            onChange={e => onRemarksChange(e.target.value)}
            placeholder="Enter remarks..."
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>
      )}
    </div>
  );
}

export default function EmployeeExpenses({ employee }: EmployeeExpensesProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const startOdoPhotoRef = useRef<HTMLInputElement>(null);
  const endOdoPhotoRef = useRef<HTMLInputElement>(null);
  const billsPhotoRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<any | null>(null);

  // Basic fields
  const [title, setTitle] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [showTypeList, setShowTypeList] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");

  // LOCAL TRAVEL CLAIM fields
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [modeOfTravel, setModeOfTravel] = useState("");
  const [travellerName, setTravellerName] = useState(employee.fullName);

  // Odometer photos (captured first)
  const [startOdoPreview, setStartOdoPreview] = useState<string | null>(null);
  const [startOdoFile, setStartOdoFile] = useState<File | null>(null);
  const [endOdoPreview, setEndOdoPreview] = useState<string | null>(null);
  const [endOdoFile, setEndOdoFile] = useState<File | null>(null);

  // Odometer readings (only enabled when both photos uploaded)
  const [startOdo, setStartOdo] = useState("");
  const [endOdo, setEndOdo] = useState("");
  const [amtPerKm, setAmtPerKm] = useState("1");

  // Bills photo
  const [billsPreview, setBillsPreview] = useState<string | null>(null);
  const [billsFile, setBillsFile] = useState<File | null>(null);

  // Headquarters
  const [headquarters, setHeadquarters] = useState("");

  // Other expense breakdown fares
  const [busFare, setBusFare] = useState("");
  const [trainAirFare, setTrainAirFare] = useState("");
  const [hotelFare, setHotelFare] = useState("");
  const [conveyanceFare, setConveyanceFare] = useState("");
  const [postageFare, setPostageFare] = useState("");
  const [otherFare, setOtherFare] = useState("");
  const [otherRemarks, setOtherRemarks] = useState("");

  // Fetch company settings (DA fixed rate)
  const { data: companySettings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/employee/company-settings"],
    queryFn: async () => {
      const r = await fetch("/api/employee/company-settings", { headers: getHeaders() });
      if (!r.ok) return {};
      return r.json();
    },
  });

  const daAmount = Number(companySettings["da_rate_per_day"] || "0");

  const bothPhotosUploaded = !!startOdoFile && !!endOdoFile;

  const isLocalTravel = expenseType === "LOCAL TRAVEL CLAIM";

  const startOdoNum = Number(startOdo) || 0;
  const endOdoNum = Number(endOdo) || 0;
  const totalDistance = bothPhotosUploaded && endOdoNum > startOdoNum ? endOdoNum - startOdoNum : 0;
  const ratePerKm = Number(amtPerKm) || 1;
  const totalTravelAmt = totalDistance * ratePerKm;

  // Sum of all other fares
  const otherExpensesTotal =
    (Number(busFare) || 0) +
    (Number(trainAirFare) || 0) +
    (Number(hotelFare) || 0) +
    daAmount +
    (Number(conveyanceFare) || 0) +
    (Number(postageFare) || 0) +
    (Number(otherFare) || 0);

  const finalAmount = totalTravelAmt + otherExpensesTotal;

  function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File) => void,
    setPreview: (p: string) => void,
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  const { data: expenses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/expenses"],
    queryFn: async () => {
      const res = await fetch("/api/employee/expenses", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!expenseType) throw new Error("Please select an expense type");
      if (!startOdoFile) throw new Error("Starting odometer photo is required");
      if (!endOdoFile) throw new Error("End odometer photo is required");
      if (finalAmount <= 0) throw new Error("Please enter odometer readings or at least one fare amount");

      const fd = new FormData();
      fd.append("title", title.trim() || `${expenseType} - ${employee.fullName}`);
      fd.append("type", expenseType);
      fd.append("category", isLocalTravel ? "Travel" : "Expense");
      fd.append("expenseDate", expenseDate);
      if (description) fd.append("description", description);
      if (employee.workLocation) fd.append("workLocation", employee.workLocation);

      // Odometer fields
      if (startOdo) fd.append("startingOdometer", startOdo);
      if (endOdo) fd.append("endOdometer", endOdo);
      if (totalDistance > 0) fd.append("totalDistance", String(totalDistance));
      fd.append("amountPerKm", amtPerKm || "1");
      if (totalTravelAmt > 0) fd.append("totalTravelAmount", String(totalTravelAmt));

      // Headquarters
      if (headquarters) fd.append("headquarters", headquarters);

      // Other expense breakdowns
      if (busFare) fd.append("busFare", busFare);
      if (trainAirFare) fd.append("trainAirFare", trainAirFare);
      if (hotelFare) fd.append("hotelFare", hotelFare);
      if (daAmount > 0) fd.append("daAmount", String(daAmount));
      if (conveyanceFare) fd.append("conveyanceFare", conveyanceFare);
      if (postageFare) fd.append("postageFare", postageFare);
      if (otherFare) fd.append("otherFare", otherFare);
      if (otherRemarks) fd.append("otherRemarks", otherRemarks);

      fd.append("amount", String(finalAmount || 0));
      fd.append("finalAmount", String(finalAmount || 0));

      // LOCAL TRAVEL CLAIM fields
      if (isLocalTravel) {
        if (startDate) fd.append("startDate", startDate);
        if (endDate) fd.append("endDate", endDate);
        if (modeOfTravel) fd.append("modeOfTravel", modeOfTravel);
        if (travellerName) fd.append("travellerName", travellerName);
      }

      // Photos
      fd.append("startingOdometerPhoto", startOdoFile);
      fd.append("endOdometerPhoto", endOdoFile);
      if (billsFile) fd.append("billsTicketPhoto", billsFile);

      const res = await fetch("/api/employee/expenses", {
        method: "POST",
        headers: getHeaders(),
        body: fd,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/expenses"] });
      resetForm();
      setView("list");
      setActiveTab("pending");
      toast({ title: "Expense submitted successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetForm() {
    setTitle(""); setExpenseType(""); setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setDescription(""); setHeadquarters("");
    setStartDate(format(new Date(), "yyyy-MM-dd")); setEndDate(format(new Date(), "yyyy-MM-dd"));
    setModeOfTravel(""); setTravellerName(employee.fullName);
    setStartOdo(""); setEndOdo(""); setAmtPerKm("1");
    setStartOdoFile(null); setStartOdoPreview(null);
    setEndOdoFile(null); setEndOdoPreview(null);
    setBillsFile(null); setBillsPreview(null);
    setBusFare(""); setTrainAirFare(""); setHotelFare("");
    setConveyanceFare(""); setPostageFare(""); setOtherFare(""); setOtherRemarks("");
  }

  const filtered = expenses.filter(e => activeTab === "all" || e.status === activeTab);
  const counts: Record<TabKey, number> = {
    pending: expenses.filter(e => e.status === "pending").length,
    approved: expenses.filter(e => e.status === "approved").length,
    rejected: expenses.filter(e => e.status === "rejected").length,
    all: expenses.length,
  };
  const filteredTypes = EXPENSE_TYPES.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));

  // ===== DETAIL VIEW =====
  if (view === "detail" && selected) {
    const exp = selected;
    const hasOtherFares = exp.busFare || exp.trainAirFare || exp.hotelFare ||
      exp.daAmount || exp.conveyanceFare || exp.postageFare || exp.otherFare;

    return (
      <div className="flex flex-col min-h-full animate-in fade-in">
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => { setView("list"); setSelected(null); }} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="font-semibold">{exp.expenseCode}</p>
            <p className="text-xs text-green-200">{exp.type}</p>
          </div>
          <StatusPill status={exp.status} />
        </div>

        <div className="space-y-3 pb-4">
          <div className="border border-gray-100 rounded-md bg-white divide-y divide-gray-100 text-sm">
            {[
              { label: "Category", value: exp.category },
              { label: "Expense Date", value: fmtDate(exp.expenseDate) },
              exp.headquarters && { label: "Headquarters", value: exp.headquarters },
              exp.modeOfTravel && { label: "Mode of Travel", value: exp.modeOfTravel },
              exp.travellerName && { label: "Traveller", value: exp.travellerName },
              exp.startDate && { label: "Start Date", value: fmtDate(exp.startDate) },
              exp.endDate && { label: "End Date", value: fmtDate(exp.endDate) },
              exp.workLocation && { label: "Location", value: exp.workLocation },
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="flex items-center px-3 py-2.5 gap-3">
                <span className="text-xs text-gray-400 w-32 shrink-0">{row.label}</span>
                <span className="text-xs font-medium text-gray-700 flex-1">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Odometer details */}
          {(exp.startingOdometer || exp.endOdometer || exp.totalDistance) && (
            <div className="border border-gray-100 rounded-md bg-white overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500">Odometer</span>
              </div>
              <div className="grid grid-cols-2 gap-3 px-3 py-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Starting Odometer</p>
                  <p className="text-sm font-bold text-gray-700">{exp.startingOdometer || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">End Odometer</p>
                  <p className="text-sm font-bold text-gray-700">{exp.endOdometer || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 px-3 pb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Starting Odometer picture</p>
                  {exp.startingOdometerPhoto
                    ? <img src={exp.startingOdometerPhoto} alt="Start odo" className="w-28 h-20 object-cover rounded border border-gray-200" />
                    : <div className="w-28 h-20 border border-gray-200 rounded flex items-center justify-center text-[10px] text-gray-300">No photo</div>}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">End Odometer picture</p>
                  {exp.endOdometerPhoto
                    ? <img src={exp.endOdometerPhoto} alt="End odo" className="w-28 h-20 object-cover rounded border border-gray-200" />
                    : <div className="w-28 h-20 border border-gray-200 rounded flex items-center justify-center text-[10px] text-gray-300">No photo</div>}
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                <div className="px-3 py-2">
                  <p className="text-[10px] text-gray-400">Total Distance</p>
                  <p className="text-xs font-bold text-gray-700">{exp.totalDistance ? `${exp.totalDistance} km` : "-"}</p>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] text-gray-400">Rate/km</p>
                  <p className="text-xs font-bold text-gray-700">₹{exp.amountPerKm || "1"}</p>
                </div>
                <div className="px-3 py-2 bg-green-50">
                  <p className="text-[10px] text-gray-400">Travel Amt</p>
                  <p className="text-xs font-bold text-green-700">₹{exp.totalTravelAmount ? Number(exp.totalTravelAmount).toLocaleString() : "-"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Other expense breakdown */}
          {hasOtherFares && (
            <div className="border border-gray-100 rounded-md bg-white overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500">Other Expenses Breakdown</span>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { label: "Bus", val: exp.busFare },
                  { label: "Train / Air", val: exp.trainAirFare },
                  { label: "Hotel", val: exp.hotelFare },
                  { label: "D.A.", val: exp.daAmount, extra: "(fixed daily wages)" },
                  { label: "Conveyance on Tour", val: exp.conveyanceFare },
                  { label: "Postage", val: exp.postageFare },
                  { label: "Other", val: exp.otherFare, extra: exp.otherRemarks ? `— ${exp.otherRemarks}` : "" },
                ].filter(r => r.val && Number(r.val) > 0).map(r => (
                  <div key={r.label} className="flex items-center px-3 py-2 gap-2">
                    <span className="text-xs text-gray-400 w-32 shrink-0">{r.label}</span>
                    <span className="text-xs font-semibold text-gray-700">₹{Number(r.val).toLocaleString()}</span>
                    {r.extra && <span className="text-[10px] text-gray-400">{r.extra}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final amount */}
          <div className="border border-gray-100 rounded-md bg-white divide-y divide-gray-100">
            <div className="flex items-center px-3 py-2.5 gap-3">
              <span className="text-xs text-gray-400 w-32 shrink-0">Amount</span>
              <span className="text-xs font-medium text-gray-700">₹{exp.amount ? Number(exp.amount).toLocaleString() : "-"}</span>
            </div>
            <div className="flex items-center px-3 py-2.5 gap-3 bg-green-50">
              <span className="text-xs text-gray-500 w-32 shrink-0 font-semibold">Final Amount</span>
              <span className="text-sm font-bold text-green-700">₹{exp.finalAmount ? Number(exp.finalAmount).toLocaleString() : "-"}</span>
            </div>
            {exp.approvedAmount && (
              <div className="flex items-center px-3 py-2.5 gap-3">
                <span className="text-xs text-gray-400 w-32 shrink-0">Approved Amount</span>
                <span className="text-xs font-bold text-green-700">₹{Number(exp.approvedAmount).toLocaleString()}</span>
              </div>
            )}
          </div>

          {exp.billsTicketPhoto && (
            <div className="border border-gray-100 rounded-md bg-white px-3 py-3">
              <p className="text-xs text-gray-400 mb-2 font-medium">Bills / Tickets</p>
              <img src={exp.billsTicketPhoto} alt="Bills" className="w-full h-40 object-cover rounded" />
            </div>
          )}

          {exp.description && (
            <div className="border border-gray-100 rounded-md bg-white px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-xs text-gray-600">{exp.description}</p>
            </div>
          )}

          {exp.adminComment && (
            <div className="border border-amber-200 rounded-md bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-600 mb-1">Admin Comment</p>
              <p className="text-xs text-amber-800">{exp.adminComment}</p>
            </div>
          )}

          {exp.status === "approved" && (
            <div className="flex items-center justify-center gap-2 text-green-700 text-xs font-semibold bg-green-50 rounded-md border border-green-200 py-3">
              <CheckCircle className="h-4 w-4" />Expense Approved
            </div>
          )}
          {exp.status === "rejected" && (
            <div className="flex items-center justify-center gap-2 text-red-600 text-xs font-semibold bg-red-50 rounded-md border border-red-200 py-3">
              <XCircle className="h-4 w-4" />Expense Rejected
            </div>
          )}

          {exp.status === "pending" && (
            <ExpenseCommentSection expenseId={exp.id} employeeName={employee.fullName} />
          )}
        </div>
      </div>
    );
  }

  // ===== CREATE VIEW =====
  if (view === "create") {
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => { setView("list"); resetForm(); }} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-base">Submit Expense</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">

          {/* Basic info */}
          <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Expense Details</p>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Expense Type */}
              <div className="relative px-3 py-2.5">
                <button
                  className="w-full text-left flex items-center justify-between"
                  onClick={() => setShowTypeList(v => !v)}
                  data-testid="button-expense-type"
                >
                  <div>
                    <p className="text-[10px] text-gray-400">Expense Type *</p>
                    <p className={`text-sm ${expenseType ? "text-gray-800 font-semibold" : "text-gray-400"}`}>
                      {expenseType || "Select type..."}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 rotate-90 shrink-0" />
                </button>
                {showTypeList && (
                  <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-xl mt-1">
                    <div className="p-2 border-b">
                      <div className="flex items-center gap-2 bg-gray-50 rounded px-2">
                        <Search className="h-3.5 w-3.5 text-gray-400" />
                        <input autoFocus value={typeSearch} onChange={e => setTypeSearch(e.target.value)} className="flex-1 bg-transparent py-1.5 text-sm outline-none" placeholder="Search..." />
                      </div>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {filteredTypes.map(t => (
                        <button key={t} onClick={() => { setExpenseType(t); setShowTypeList(false); setTypeSearch(""); }}
                          className={`w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 border-b last:border-0 ${expenseType === t ? "bg-green-50 text-green-700 font-semibold" : ""}`}
                          data-testid={`option-type-${t}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expense Date */}
              <div className="px-3 py-2.5">
                <p className="text-[10px] text-gray-400 mb-1">Expense Date *</p>
                <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)}
                  className="w-full text-sm bg-transparent outline-none text-gray-700" data-testid="input-expense-date" />
              </div>

              {/* Headquarters */}
              <div className="px-3 py-2.5">
                <p className="text-[10px] text-gray-400 mb-1">Headquarters</p>
                <input value={headquarters} onChange={e => setHeadquarters(e.target.value)}
                  placeholder="Enter headquarters location..."
                  className="w-full text-sm bg-transparent outline-none text-gray-700" data-testid="input-headquarters" />
              </div>

              {/* Description */}
              <div className="px-3 py-2.5">
                <p className="text-[10px] text-gray-400 mb-1">Description</p>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Add description or notes..."
                  className="w-full text-sm bg-transparent outline-none text-gray-700" data-testid="input-description" />
              </div>
            </div>
          </div>

          {/* LOCAL TRAVEL CLAIM specific */}
          {isLocalTravel && (
            <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
              <div className="px-3 py-2 bg-green-700 text-white text-xs font-semibold">LOCAL TRAVEL CLAIM</div>
              <div className="divide-y divide-gray-100">
                <div className="px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-1">Start Date</p>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full text-sm bg-transparent outline-none" data-testid="input-start-date" />
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-1">End Date</p>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full text-sm bg-transparent outline-none" data-testid="input-end-date" />
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-1">Mode of Travel</p>
                  <select
                    value={modeOfTravel}
                    onChange={e => setModeOfTravel(e.target.value)}
                    className="w-full text-sm bg-transparent outline-none text-gray-800 appearance-none"
                    data-testid="select-mode-travel"
                  >
                    <option value="">Select...</option>
                    {TRAVEL_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-1">Traveller Name</p>
                  <input value={travellerName} onChange={e => setTravellerName(e.target.value)}
                    className="w-full text-sm bg-transparent outline-none" data-testid="input-traveller" />
                </div>
              </div>
            </div>
          )}

          {/* ODOMETER SECTION — photos first, then readings unlock */}
          <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs font-semibold text-gray-600">Odometer</span>
              {!bothPhotosUploaded && (
                <span className="ml-auto text-[10px] text-amber-600 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Upload both photos to enter readings
                </span>
              )}
            </div>

            <div className="px-3 py-3 space-y-4">
              {/* Step 1: Capture photos */}
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-2">Step 1 — Capture Odometer Photos <span className="text-red-500">*</span></p>
                <div className="flex gap-6">
                  <div>
                    <PhotoBox
                      label="Starting Odometer Photo"
                      mandatory
                      preview={startOdoPreview}
                      onCapture={() => startOdoPhotoRef.current?.click()}
                      onClear={() => {
                        setStartOdoFile(null); setStartOdoPreview(null);
                        setStartOdo(""); setEndOdo("");
                      }}
                    />
                    <input ref={startOdoPhotoRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => handlePhotoChange(e, setStartOdoFile, setStartOdoPreview)} />
                  </div>
                  <div>
                    <PhotoBox
                      label="End Odometer Photo"
                      mandatory
                      preview={endOdoPreview}
                      onCapture={() => endOdoPhotoRef.current?.click()}
                      onClear={() => { setEndOdoFile(null); setEndOdoPreview(null); setEndOdo(""); }}
                    />
                    <input ref={endOdoPhotoRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => handlePhotoChange(e, setEndOdoFile, setEndOdoPreview)} />
                  </div>
                </div>
              </div>

              {/* Step 2: Enter readings (only after both photos) */}
              <div className={!bothPhotosUploaded ? "opacity-50 pointer-events-none select-none" : ""}>
                <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1">
                  Step 2 — Enter Odometer Readings
                  {!bothPhotosUploaded && <Lock className="h-3 w-3 text-gray-400" />}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Starting Reading (km)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={startOdo}
                      onChange={e => setStartOdo(e.target.value)}
                      disabled={!bothPhotosUploaded}
                      className="text-sm h-9"
                      data-testid="input-start-odometer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">End Reading (km)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50120"
                      value={endOdo}
                      onChange={e => setEndOdo(e.target.value)}
                      disabled={!bothPhotosUploaded}
                      className="text-sm h-9"
                      data-testid="input-end-odometer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Total Distance</p>
                    <div className="bg-gray-50 rounded px-2 py-1.5 text-xs font-bold text-gray-700">
                      {totalDistance > 0 ? `${totalDistance} km` : "-"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Amount /Km *</p>
                    <Input
                      type="number"
                      value={amtPerKm}
                      onChange={e => setAmtPerKm(e.target.value)}
                      disabled={!bothPhotosUploaded}
                      className="text-xs h-8 px-2"
                      data-testid="input-amt-per-km"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Travel Amount</p>
                    <div className={`rounded px-2 py-1.5 text-xs font-bold ${totalTravelAmt > 0 ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
                      {totalTravelAmt > 0 ? `₹${totalTravelAmt.toFixed(0)}` : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OTHER EXPENSES BREAKDOWN */}
          <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600">Other Expenses Breakdown</p>
              {daAmount > 0 && (
                <p className="text-[10px] text-gray-400 mt-0.5">D.A.: ₹{daAmount} fixed daily wages</p>
              )}
            </div>

            <div className="px-3 py-3 space-y-3">
              <FareRow label="Bus" value={busFare} onChange={setBusFare} />
              <FareRow label="Train / Air" value={trainAirFare} onChange={setTrainAirFare} />
              <FareRow label="Hotel Expenses" value={hotelFare} onChange={setHotelFare} />

              {/* D.A. — fixed rate from admin settings */}
              <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-600 w-36 shrink-0 font-medium">D.A.</span>
                <span className={`text-xs font-bold ${daAmount > 0 ? "text-green-700" : "text-gray-400"}`}>
                  {daAmount > 0 ? `₹${daAmount}` : "Not configured"}
                </span>
                {daAmount > 0 && (
                  <span className="text-[10px] text-gray-400">(fixed daily wages)</span>
                )}
              </div>

              <FareRow label="Conveyance on Tour" value={conveyanceFare} onChange={setConveyanceFare} />
              <FareRow label="Postage" value={postageFare} onChange={setPostageFare} />
              <FareRow
                label="Other"
                value={otherFare}
                onChange={setOtherFare}
                remarks={otherRemarks}
                onRemarksChange={setOtherRemarks}
              />

              {/* Sub-total of other expenses */}
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-semibold">Other Expenses Sub-total</span>
                <span className={`text-sm font-bold ${otherExpensesTotal > 0 ? "text-green-700" : "text-gray-400"}`}>
                  {otherExpensesTotal > 0 ? `₹${otherExpensesTotal.toFixed(0)}` : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* GRAND TOTAL */}
          <div className="border border-green-200 rounded-md bg-green-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-semibold">Grand Total</p>
              <p className="text-[10px] text-green-600">Odometer + Other Expenses</p>
            </div>
            <p className={`text-lg font-bold ${finalAmount > 0 ? "text-green-700" : "text-gray-400"}`}>
              {finalAmount > 0 ? `₹${finalAmount.toFixed(0)}` : "-"}
            </p>
          </div>

          {/* Bills / Tickets */}
          <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500">Bills / Tickets</span>
              </div>
              <button onClick={() => billsPhotoRef.current?.click()} className="text-green-700 text-xs font-semibold flex items-center gap-1" data-testid="button-add-bills">
                <Plus className="h-3.5 w-3.5" /> Add Photo
              </button>
            </div>
            {billsPreview ? (
              <div className="relative p-2">
                <img src={billsPreview} alt="Bills" className="w-full h-32 object-cover rounded" />
                <button onClick={() => { setBillsFile(null); setBillsPreview(null); }} className="absolute top-3 right-3 bg-white rounded-full p-0.5 shadow">
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No photo attached</div>
            )}
            <input ref={billsPhotoRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => handlePhotoChange(e, setBillsFile, setBillsPreview)} />
          </div>

          {/* Warnings */}
          {expenseType && !startOdoFile && (
            <div className="flex items-start gap-2 px-3 py-2.5 border border-amber-200 bg-amber-50 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Please capture the starting odometer photo first.</p>
            </div>
          )}
          {startOdoFile && !endOdoFile && (
            <div className="flex items-start gap-2 px-3 py-2.5 border border-amber-200 bg-amber-50 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Please capture the end odometer photo to unlock readings entry.</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t">
          <Button
            className="w-full bg-green-700 hover:bg-green-800 font-bold py-3"
            disabled={!expenseType || !startOdoFile || !endOdoFile || createMutation.isPending || finalAmount <= 0}
            onClick={() => createMutation.mutate()}
            data-testid="button-submit-expense"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            SUBMIT
          </Button>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  const TABS: { key: TabKey; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in">
      <div className="flex border-b border-gray-200 mb-3 -mx-4 px-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative ${activeTab === tab.key ? "text-green-700 border-b-2 border-green-700" : "text-gray-400"}`}
            data-testid={`tab-${tab.key}`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Banknote className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No Expenses Found</p>
            <p className="text-xs text-gray-300">Tap + to submit an expense</p>
          </div>
        ) : (
          filtered.map(exp => (
            <div
              key={exp.id}
              className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => { setSelected(exp); setView("detail"); }}
              data-testid={`card-expense-${exp.id}`}
            >
              <div className="px-3 py-2.5 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{exp.title || exp.expenseCode}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{exp.expenseCode} · {fmtDate(exp.expenseDate)}</p>
                </div>
                <StatusPill status={exp.status} />
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">{exp.type}</span>
                <span className="text-sm font-bold text-green-700">
                  ₹{exp.finalAmount ? Number(exp.finalAmount).toLocaleString() : Number(exp.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setView("create")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-green-800 active:scale-95 transition-all z-10"
        data-testid="button-new-expense"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
