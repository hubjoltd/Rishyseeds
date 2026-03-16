import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Loader2, ChevronRight, Camera, CheckCircle,
  XCircle, Clock, Gauge, FileText, Banknote, Search, X, AlertCircle,
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

const EXPENSE_CATEGORIES = ["Food", "Fuel", "Travel", "Office", "Medical", "Accommodation", "Communication", "Other"];

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

function OdoPhotoBox({
  label, mandatory, preview, onCapture, onClear, inputRef,
}: {
  label: string; mandatory?: boolean; preview: string | null;
  onCapture: () => void; onClear: () => void; inputRef: React.RefObject<HTMLInputElement>;
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
          onClick={onCapture}
          className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors"
          data-testid={`button-capture-${label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <Camera className="h-5 w-5" />
          <span className="text-[10px]">Capture</span>
        </button>
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
  const [expenseCategory, setExpenseCategory] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  // LOCAL TRAVEL CLAIM fields
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modeOfTravel, setModeOfTravel] = useState("");
  const [showModeList, setShowModeList] = useState(false);
  const [travellerName, setTravellerName] = useState(employee.fullName);

  // Odometer fields
  const [startOdo, setStartOdo] = useState("");
  const [endOdo, setEndOdo] = useState("");
  const [amtPerKm, setAmtPerKm] = useState("1");
  const [startOdoPreview, setStartOdoPreview] = useState<string | null>(null);
  const [startOdoFile, setStartOdoFile] = useState<File | null>(null);
  const [endOdoPreview, setEndOdoPreview] = useState<string | null>(null);
  const [endOdoFile, setEndOdoFile] = useState<File | null>(null);
  const [billsPreview, setBillsPreview] = useState<string | null>(null);
  const [billsFile, setBillsFile] = useState<File | null>(null);

  const isLocalTravel = expenseType === "LOCAL TRAVEL CLAIM";

  const startOdoNum = Number(startOdo) || 0;
  const endOdoNum = Number(endOdo) || 0;
  const totalDistance = endOdoNum > startOdoNum ? endOdoNum - startOdoNum : 0;
  const ratePerKm = Number(amtPerKm) || 1;
  const totalTravelAmt = totalDistance * ratePerKm;
  const additionalAmt = Number(manualAmount) || 0;
  const finalAmount = totalTravelAmt > 0 ? totalTravelAmt + additionalAmt : additionalAmt;

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
      if (finalAmount <= 0 && !manualAmount) throw new Error("Please enter odometer readings or an amount");

      const fd = new FormData();
      fd.append("title", title.trim() || `${expenseType} - ${employee.fullName}`);
      fd.append("type", expenseType);
      fd.append("category", isLocalTravel ? "Travel" : "Expense");
      fd.append("expenseDate", expenseDate);
      if (description) fd.append("description", description);
      if (employee.workLocation) fd.append("workLocation", employee.workLocation);
      if (expenseCategory) fd.append("expenseCategory", expenseCategory);

      // Odometer fields
      if (startOdo) fd.append("startingOdometer", startOdo);
      if (endOdo) fd.append("endOdometer", endOdo);
      if (totalDistance > 0) fd.append("totalDistance", String(totalDistance));
      fd.append("amountPerKm", amtPerKm || "1");
      if (totalTravelAmt > 0) fd.append("totalTravelAmount", String(totalTravelAmt));
      if (manualAmount) fd.append("amount", manualAmount);
      else fd.append("amount", String(finalAmount || 0));
      fd.append("finalAmount", String(finalAmount || 0));

      // LOCAL TRAVEL CLAIM fields
      if (isLocalTravel) {
        if (startDate) fd.append("startDate", startDate);
        if (endDate) fd.append("endDate", endDate);
        if (modeOfTravel) fd.append("modeOfTravel", modeOfTravel);
        if (travellerName) fd.append("travellerName", travellerName);
      }

      // Photos
      if (startOdoFile) fd.append("startingOdometerPhoto", startOdoFile);
      if (endOdoFile) fd.append("endOdometerPhoto", endOdoFile);
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
    setDescription(""); setExpenseCategory(""); setManualAmount("");
    setStartDate(""); setEndDate(""); setModeOfTravel(""); setTravellerName(employee.fullName);
    setStartOdo(""); setEndOdo(""); setAmtPerKm("1");
    setStartOdoFile(null); setStartOdoPreview(null);
    setEndOdoFile(null); setEndOdoPreview(null);
    setBillsFile(null); setBillsPreview(null);
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
          {/* Core fields */}
          <div className="border border-gray-100 rounded-md bg-white divide-y divide-gray-100 text-sm">
            {[
              { label: "Category", value: exp.category },
              { label: "Amount", value: exp.amount ? `Rs. ${Number(exp.amount).toLocaleString()}` : "-" },
              { label: "Expense Date", value: fmtDate(exp.expenseDate) },
              exp.expenseCategory && { label: "Expense Category", value: exp.expenseCategory },
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
                {/* Start odometer */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Starting Odometer</p>
                  <p className="text-sm font-bold text-gray-700">{exp.startingOdometer || "-"}</p>
                </div>
                {/* End odometer */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">End Odometer</p>
                  <p className="text-sm font-bold text-gray-700">{exp.endOdometer || "-"}</p>
                </div>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-2 gap-3 px-3 pb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Starting Odometer picture</p>
                  {exp.startingOdometerPhoto ? (
                    <img src={exp.startingOdometerPhoto} alt="Start odo" className="w-28 h-20 object-cover rounded border border-gray-200" />
                  ) : <div className="w-28 h-20 border border-gray-200 rounded flex items-center justify-center text-[10px] text-gray-300">No photo</div>}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">End Odometer picture</p>
                  {exp.endOdometerPhoto ? (
                    <img src={exp.endOdometerPhoto} alt="End odo" className="w-28 h-20 object-cover rounded border border-gray-200" />
                  ) : <div className="w-28 h-20 border border-gray-200 rounded flex items-center justify-center text-[10px] text-gray-300">No photo</div>}
                </div>
              </div>

              {/* Calculated values */}
              <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                <div className="px-3 py-2">
                  <p className="text-[10px] text-gray-400">Total Distance</p>
                  <p className="text-xs font-bold text-gray-700">{exp.totalDistance ? `${exp.totalDistance} km` : "-"}</p>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] text-gray-400">Amount/Km</p>
                  <p className="text-xs font-bold text-gray-700">Rs. {exp.amountPerKm || "1"}</p>
                </div>
              </div>
              <div className="px-3 py-2 border-t border-gray-100 bg-green-50">
                <p className="text-[10px] text-gray-400">Total Travel Amount</p>
                <p className="text-sm font-bold text-green-700">Rs. {exp.totalTravelAmount ? Number(exp.totalTravelAmount).toLocaleString() : "-"}</p>
              </div>
            </div>
          )}

          {/* Final amount */}
          <div className="border border-gray-100 rounded-md bg-white divide-y divide-gray-100">
            <div className="flex items-center px-3 py-2.5 gap-3">
              <span className="text-xs text-gray-400 w-32 shrink-0">Amount</span>
              <span className="text-xs font-medium text-gray-700">Rs. {exp.amount ? Number(exp.amount).toLocaleString() : "-"}</span>
            </div>
            <div className="flex items-center px-3 py-2.5 gap-3 bg-green-50">
              <span className="text-xs text-gray-500 w-32 shrink-0 font-semibold">Final Amount</span>
              <span className="text-sm font-bold text-green-700">Rs. {exp.finalAmount ? Number(exp.finalAmount).toLocaleString() : "-"}</span>
            </div>
            {exp.approvedAmount && (
              <div className="flex items-center px-3 py-2.5 gap-3">
                <span className="text-xs text-gray-400 w-32 shrink-0">Approved Amount</span>
                <span className="text-xs font-bold text-green-700">Rs. {Number(exp.approvedAmount).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Bills photo */}
          {exp.billsTicketPhoto && (
            <div className="border border-gray-100 rounded-md bg-white px-3 py-3">
              <p className="text-xs text-gray-400 mb-2 font-medium">Bills / Tickets</p>
              <img src={exp.billsTicketPhoto} alt="Bills" className="w-full h-40 object-cover rounded" />
            </div>
          )}

          {/* Description */}
          {exp.description && (
            <div className="border border-gray-100 rounded-md bg-white px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-xs text-gray-600">{exp.description}</p>
            </div>
          )}

          {/* Admin comment */}
          {exp.adminComment && (
            <div className="border border-amber-200 rounded-md bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-600 mb-1">Admin Comment</p>
              <p className="text-xs text-amber-800">{exp.adminComment}</p>
            </div>
          )}

          {/* Status banner */}
          {exp.status === "pending" && (
            <div className="flex items-center justify-center gap-2 text-amber-600 text-xs font-semibold bg-amber-50 rounded-md border border-amber-200 py-3">
              <Clock className="h-4 w-4" />Awaiting approval
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

              {/* Category */}
              <div className="px-3 py-2.5">
                <p className="text-[10px] text-gray-400 mb-1">Expense Category *</p>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full text-sm bg-transparent outline-none text-gray-700"
                  data-testid="select-expense-category"
                >
                  <option value="">Select category...</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Expense Date */}
              <div className="px-3 py-2.5">
                <p className="text-[10px] text-gray-400 mb-1">Expense Date *</p>
                <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)}
                  className="w-full text-sm bg-transparent outline-none text-gray-700" data-testid="input-expense-date" />
              </div>

              {/* Title */}
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
                <div className="relative px-3 py-2.5">
                  <button className="w-full text-left flex items-center justify-between" onClick={() => setShowModeList(v => !v)} data-testid="button-mode-travel">
                    <div>
                      <p className="text-[10px] text-gray-400">Mode of Travel</p>
                      <p className={`text-sm ${modeOfTravel ? "text-gray-800" : "text-gray-400"}`}>{modeOfTravel || "Select..."}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 rotate-90 shrink-0" />
                  </button>
                  {showModeList && (
                    <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-xl mt-1">
                      {TRAVEL_MODES.map(m => (
                        <button key={m} onClick={() => { setModeOfTravel(m); setShowModeList(false); }}
                          className={`w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 border-b last:border-0 ${modeOfTravel === m ? "bg-green-50 text-green-700 font-semibold" : ""}`}
                          data-testid={`option-mode-${m}`}
                        >{m}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-1">Traveller Name</p>
                  <input value={travellerName} onChange={e => setTravellerName(e.target.value)}
                    className="w-full text-sm bg-transparent outline-none" data-testid="input-traveller" />
                </div>
              </div>
            </div>
          )}

          {/* ODOMETER SECTION */}
          <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs font-semibold text-gray-600">Expense (Odometer)</span>
            </div>

            <div className="px-3 py-3 space-y-4">
              {/* Starting Odometer */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">
                  Starting Odometer <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Enter starting km reading"
                  value={startOdo}
                  onChange={e => setStartOdo(e.target.value)}
                  className="text-sm mb-3"
                  data-testid="input-start-odometer"
                />
                <p className="text-xs text-gray-500 font-medium mb-1.5">
                  Starting Odometer picture <span className="text-red-500">*</span>
                </p>
                <OdoPhotoBox
                  label="Start Odometer"
                  mandatory
                  preview={startOdoPreview}
                  onCapture={() => startOdoPhotoRef.current?.click()}
                  onClear={() => { setStartOdoFile(null); setStartOdoPreview(null); }}
                  inputRef={startOdoPhotoRef}
                />
                <input
                  ref={startOdoPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => handlePhotoChange(e, setStartOdoFile, setStartOdoPreview)}
                />
              </div>

              {/* End Odometer */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">End Odometer</label>
                <Input
                  type="number"
                  placeholder="Please enter number"
                  value={endOdo}
                  onChange={e => setEndOdo(e.target.value)}
                  className="text-sm mb-3"
                  data-testid="input-end-odometer"
                />
                <p className="text-xs text-gray-500 font-medium mb-1.5">End Odometer picture</p>
                <OdoPhotoBox
                  label="End Odometer"
                  preview={endOdoPreview}
                  onCapture={() => endOdoPhotoRef.current?.click()}
                  onClear={() => { setEndOdoFile(null); setEndOdoPreview(null); }}
                  inputRef={endOdoPhotoRef}
                />
                <input
                  ref={endOdoPhotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => handlePhotoChange(e, setEndOdoFile, setEndOdoPreview)}
                />
              </div>

              {/* Computed row */}
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
                    className="text-xs h-8 px-2"
                    data-testid="input-amt-per-km"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Total Travel Amt</p>
                  <div className={`rounded px-2 py-1.5 text-xs font-bold ${totalTravelAmt > 0 ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
                    {totalTravelAmt > 0 ? `Rs.${totalTravelAmt.toFixed(0)}` : "-"}
                  </div>
                </div>
              </div>

              {/* Amount + Final */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Amount</p>
                  <Input
                    type="number"
                    placeholder="Manual amount"
                    value={manualAmount}
                    onChange={e => setManualAmount(e.target.value)}
                    className="text-sm h-9"
                    data-testid="input-manual-amount"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Final Amount</p>
                  <div className={`rounded-md px-3 py-2 text-sm font-bold border ${finalAmount > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                    {finalAmount > 0 ? `Rs. ${finalAmount.toFixed(0)}` : "-"}
                  </div>
                </div>
              </div>
            </div>
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

          {/* Warning if photo missing */}
          {expenseType && !startOdoFile && (
            <div className="flex items-start gap-2 px-3 py-2.5 border border-amber-200 bg-amber-50 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Please capture the starting odometer photo to proceed.</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t">
          <Button
            className="w-full bg-green-700 hover:bg-green-800 font-bold py-3"
            disabled={!expenseType || !startOdoFile || createMutation.isPending || finalAmount <= 0}
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
      {/* Tab bar */}
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

      {/* Expense cards */}
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
              <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-[11px] text-green-700 font-semibold">{exp.expenseCode}</p>
                  <p className="text-sm font-bold text-gray-800 leading-tight">{exp.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{exp.type}</p>
                </div>
                <StatusPill status={exp.status} />
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                <div className="px-2 py-1.5 text-center">
                  <p className="text-[10px] text-gray-400">Distance</p>
                  <p className="text-xs font-bold text-gray-600">{exp.totalDistance ? `${exp.totalDistance}km` : "-"}</p>
                </div>
                <div className="px-2 py-1.5 text-center">
                  <p className="text-[10px] text-gray-400">Travel Amt</p>
                  <p className="text-xs font-bold text-gray-600">{exp.totalTravelAmount ? `Rs.${Number(exp.totalTravelAmount).toFixed(0)}` : "-"}</p>
                </div>
                <div className="px-2 py-1.5 text-center">
                  <p className="text-[10px] text-gray-400">Final</p>
                  <p className="text-xs font-bold text-green-700">Rs.{Number(exp.finalAmount || exp.amount || 0).toLocaleString()}</p>
                </div>
              </div>
              {exp.adminComment && (
                <div className="px-3 py-1.5 border-t border-amber-100 bg-amber-50">
                  <p className="text-[11px] text-amber-700 truncate">{exp.adminComment}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setView("create")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center z-50 transition-transform active:scale-95"
        data-testid="button-new-expense"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
