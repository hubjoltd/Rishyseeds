import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Loader2, ChevronRight, Camera, CheckCircle,
  XCircle, Clock, Gauge, FileText, Banknote, Search, X,
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
function fmtDT(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy, hh:mm a"); } catch { return "-"; }
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

export default function EmployeeExpenses({ employee }: EmployeeExpensesProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<any | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [showTypeList, setShowTypeList] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  // LOCAL TRAVEL CLAIM fields
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modeOfTravel, setModeOfTravel] = useState("");
  const [showModeList, setShowModeList] = useState(false);
  const [fareAmount, setFareAmount] = useState("");
  const [travellerName, setTravellerName] = useState(employee.fullName);
  const [distanceCovered, setDistanceCovered] = useState("");
  // Odometer fields (for odometer-based claims)
  const [startOdo, setStartOdo] = useState("");
  const [endOdo, setEndOdo] = useState("");
  const [amtPerKm, setAmtPerKm] = useState("1");
  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const isLocalTravel = expenseType === "LOCAL TRAVEL CLAIM";
  const computedDistance = Number(endOdo) - Number(startOdo);
  const computedTravel = computedDistance > 0 ? computedDistance * Number(amtPerKm || 1) : 0;
  const finalAmt = isLocalTravel ? (fareAmount || String(computedTravel) || "0") : (amount || "0");

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
      const payload: any = {
        title: title.trim() || `${expenseType} - ${employee.fullName}`,
        type: expenseType,
        category: isLocalTravel ? "Travel" : "Expense",
        expenseDate,
        description,
        workLocation: employee.workLocation || "",
        amount: finalAmt,
        finalAmount: finalAmt,
      };
      if (isLocalTravel) {
        payload.startDate = startDate || undefined;
        payload.endDate = endDate || undefined;
        payload.modeOfTravel = modeOfTravel || undefined;
        payload.travellerName = travellerName || undefined;
        payload.totalDistance = distanceCovered || (computedDistance > 0 ? String(computedDistance) : undefined);
        if (startOdo) payload.startingOdometer = startOdo;
        if (endOdo) payload.endOdometer = endOdo;
        if (amtPerKm) payload.amountPerKm = amtPerKm;
        if (computedTravel > 0) payload.totalTravelAmount = String(computedTravel);
      }
      const res = await fetch("/api/employee/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/expenses"] });
      resetForm();
      setView("list");
      setActiveTab("pending");
      toast({ title: "Expense submitted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetForm() {
    setTitle(""); setExpenseType(""); setAmount(""); setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setDescription(""); setStartDate(""); setEndDate(""); setModeOfTravel("");
    setFareAmount(""); setTravellerName(employee.fullName); setDistanceCovered("");
    setStartOdo(""); setEndOdo(""); setAmtPerKm("1"); setPhotoFile(null); setPhotoPreview(null);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
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
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => { setView("list"); setSelected(null); }} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <span className="font-semibold text-base">{exp.expenseCode}</span>
          </div>
          <StatusPill status={exp.status} />
        </div>

        <div className="bg-green-700 text-white rounded-md px-3 py-2 text-xs font-semibold mb-4">
          {exp.type}
        </div>

        <div className="space-y-0 border border-gray-100 rounded-md divide-y divide-gray-100 bg-white text-sm mb-4">
          {[
            { label: "Title", value: exp.title },
            { label: "Amount", value: exp.amount ? `Rs. ${Number(exp.amount).toLocaleString()}` : "-" },
            { label: "Expense Date", value: fmtDate(exp.expenseDate) },
            exp.modeOfTravel && { label: "Mode of Travel", value: exp.modeOfTravel },
            exp.travellerName && { label: "Traveller", value: exp.travellerName },
            exp.startDate && { label: "Start Date", value: fmtDate(exp.startDate) },
            exp.endDate && { label: "End Date", value: fmtDate(exp.endDate) },
            exp.totalDistance && { label: "Distance Covered", value: `${exp.totalDistance} km` },
            exp.startingOdometer && { label: "Start Odometer", value: `${exp.startingOdometer} km` },
            exp.endOdometer && { label: "End Odometer", value: `${exp.endOdometer} km` },
            exp.amountPerKm && { label: "Amount / km", value: `Rs. ${exp.amountPerKm}` },
            exp.totalTravelAmount && { label: "Travel Amount", value: `Rs. ${Number(exp.totalTravelAmount).toLocaleString()}` },
            exp.approvedAmount && { label: "Approved Amount", value: `Rs. ${Number(exp.approvedAmount).toLocaleString()}` },
            exp.workLocation && { label: "Location", value: exp.workLocation },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex items-start px-3 py-2.5 gap-3">
              <span className="text-gray-400 text-xs w-32 shrink-0 pt-0.5">{row.label}</span>
              <span className="text-xs text-gray-300 shrink-0">:</span>
              <span className="flex-1 text-xs font-medium text-gray-700">{row.value}</span>
            </div>
          ))}
        </div>

        {exp.description && (
          <div className="border border-gray-100 rounded-md bg-white mb-4 px-3 py-2.5">
            <p className="text-xs text-gray-400 font-medium mb-1">Description / Notes</p>
            <p className="text-xs text-gray-600">{exp.description}</p>
          </div>
        )}

        {exp.adminComment && (
          <div className="border border-amber-200 rounded-md bg-amber-50 mb-4 px-3 py-2.5">
            <p className="text-xs text-amber-600 font-semibold mb-1">Admin Comment</p>
            <p className="text-xs text-amber-800">{exp.adminComment}</p>
            {exp.statusUpdatedBy && (
              <p className="text-[10px] text-amber-500 mt-1">— {exp.statusUpdatedBy}</p>
            )}
          </div>
        )}

        {exp.status === "pending" && (
          <div className="flex items-center justify-center gap-2 text-amber-600 text-xs font-semibold bg-amber-50 rounded-md border border-amber-200 py-3">
            <Clock className="h-4 w-4" />
            Awaiting approval from your RM
          </div>
        )}
        {exp.status === "approved" && (
          <div className="flex items-center justify-center gap-2 text-green-700 text-xs font-semibold bg-green-50 rounded-md border border-green-200 py-3">
            <CheckCircle className="h-4 w-4" />
            Expense Approved
          </div>
        )}
        {exp.status === "rejected" && (
          <div className="flex items-center justify-center gap-2 text-red-600 text-xs font-semibold bg-red-50 rounded-md border border-red-200 py-3">
            <XCircle className="h-4 w-4" />
            Expense Rejected
          </div>
        )}
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
          <span className="font-semibold text-base">Create Expense</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Where you spent */}
          <div className="border border-gray-200 rounded-md px-3 py-2 bg-white">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Where you spent</p>

            {/* Title */}
            <div className="border-b border-gray-100 pb-2 mb-2">
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="border-0 px-0 text-sm h-7 focus-visible:ring-0 bg-transparent"
                data-testid="input-expense-title"
              />
            </div>

            {/* Expense Type */}
            <div className="relative">
              <button
                className="w-full text-left flex items-center justify-between py-2 text-sm"
                onClick={() => setShowTypeList(v => !v)}
                data-testid="button-expense-type"
              >
                <span className={expenseType ? "text-gray-800 text-xs font-semibold" : "text-gray-400 text-sm"}>
                  {expenseType || "Expense Type *"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
              </button>
              {showTypeList && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                  <div className="p-2 border-b">
                    <div className="flex items-center gap-2 bg-gray-50 rounded px-2">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <input autoFocus value={typeSearch} onChange={e => setTypeSearch(e.target.value)} className="flex-1 bg-transparent py-1.5 text-sm outline-none" placeholder="Search..." />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTypes.map(t => (
                      <button key={t} onClick={() => { setExpenseType(t); setShowTypeList(false); setTypeSearch(""); }} className={`w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 border-b last:border-0 ${expenseType === t ? "bg-green-50 text-green-700 font-semibold" : ""}`} data-testid={`option-exp-type-${t}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amount for non-travel types */}
            {!isLocalTravel && (
              <div className="border-t border-gray-100 pt-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rs.</span>
                  <Input
                    type="number"
                    placeholder="Amount *"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="border-0 px-0 text-sm h-7 focus-visible:ring-0"
                    data-testid="input-expense-amount"
                  />
                </div>
              </div>
            )}
          </div>

          {/* LOCAL TRAVEL CLAIM specific fields */}
          {isLocalTravel && (
            <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
              <div className="px-3 py-2 bg-green-700 text-white text-xs font-semibold">
                LOCAL TRAVEL CLAIM
              </div>
              <div className="divide-y divide-gray-100">
                {/* Start Date */}
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">START DATE *</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-travel-start-date" />
                </div>
                {/* End Date */}
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">END DATE *</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-travel-end-date" />
                </div>
                {/* Mode of Travel */}
                <div className="flex items-center px-3 py-2.5 gap-3 relative">
                  <label className="text-xs text-gray-400 w-28 shrink-0">MODE OF TRAVEL *</label>
                  <button className="flex-1 text-left flex items-center justify-between" onClick={() => setShowModeList(v => !v)} data-testid="button-mode-travel">
                    <span className={modeOfTravel ? "text-xs text-gray-800" : "text-xs text-gray-400"}>{modeOfTravel || "Select"}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 rotate-90" />
                  </button>
                  {showModeList && (
                    <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                      {TRAVEL_MODES.map(m => (
                        <button key={m} onClick={() => { setModeOfTravel(m); setShowModeList(false); }} className={`w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 border-b last:border-0 ${modeOfTravel === m ? "bg-green-50 text-green-700 font-semibold" : ""}`} data-testid={`option-mode-${m}`}>{m}</button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Fare Amount */}
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">FARE AMOUNT *</label>
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-xs text-gray-500">Rs.</span>
                    <input type="number" value={fareAmount} onChange={e => setFareAmount(e.target.value)} placeholder="Enter amount" className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-fare-amount" />
                  </div>
                </div>
                {/* Traveller Name */}
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">NAME OF TRAVELLER *</label>
                  <input value={travellerName} onChange={e => setTravellerName(e.target.value)} placeholder="Traveller name" className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-traveller-name" />
                </div>
                {/* Distance */}
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">DISTANCE (km)</label>
                  <input type="number" value={distanceCovered} onChange={e => setDistanceCovered(e.target.value)} placeholder="km covered" className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-distance" />
                </div>
              </div>
            </div>
          )}

          {/* Odometer section (for all types but especially travel) */}
          {isLocalTravel && (
            <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500">Odometer (Optional)</span>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">Start Reading</label>
                  <input type="number" value={startOdo} onChange={e => setStartOdo(e.target.value)} placeholder="e.g. 50000" className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-start-odo" />
                </div>
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">End Reading</label>
                  <input type="number" value={endOdo} onChange={e => setEndOdo(e.target.value)} placeholder="e.g. 50185" className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-end-odo" />
                </div>
                <div className="flex items-center px-3 py-2.5 gap-3">
                  <label className="text-xs text-gray-400 w-28 shrink-0">Rate (Rs./km)</label>
                  <input type="number" value={amtPerKm} onChange={e => setAmtPerKm(e.target.value)} className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-amt-per-km" />
                </div>
                {computedDistance > 0 && (
                  <div className="px-3 py-2.5 bg-green-50 grid grid-cols-3 gap-3">
                    <div><p className="text-[10px] text-gray-400">Distance</p><p className="text-xs font-bold">{computedDistance} km</p></div>
                    <div><p className="text-[10px] text-gray-400">Travel Amt</p><p className="text-xs font-bold text-green-700">Rs.{computedTravel.toFixed(0)}</p></div>
                    <div><p className="text-[10px] text-gray-400">Fare / Travel</p><p className="text-xs font-bold text-green-700">Rs.{fareAmount || computedTravel.toFixed(0)}</p></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expense date (non-travel) */}
          {!isLocalTravel && (
            <div className="border border-gray-200 rounded-md bg-white">
              <div className="flex items-center px-3 py-2.5 gap-3">
                <label className="text-xs text-gray-400 w-28 shrink-0">Expense Date</label>
                <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="flex-1 text-xs outline-none border-0 bg-transparent" data-testid="input-expense-date" />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="border border-gray-200 rounded-md bg-white px-3 py-2.5">
            <p className="text-xs text-gray-400 font-medium mb-1">Description / Notes</p>
            <Textarea
              placeholder="Additional notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="border-0 px-0 focus-visible:ring-0 resize-none min-h-[60px] text-xs"
              data-testid="input-expense-description"
            />
          </div>

          {/* Bills / Tickets */}
          <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500">BILLS / TICKETS</span>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="text-green-700 text-xs font-semibold flex items-center gap-1" data-testid="button-add-photo">
                <Plus className="h-3.5 w-3.5" /> Add Photo
              </button>
            </div>
            {photoPreview ? (
              <div className="relative p-2">
                <img src={photoPreview} alt="Bill" className="w-full h-32 object-cover rounded" />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-3 right-3 bg-white rounded-full p-0.5 shadow">
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No photo attached
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          </div>
        </div>

        <div className="pt-3 border-t">
          <Button
            className="w-full bg-green-700 hover:bg-green-800 font-bold py-3"
            disabled={!expenseType || createMutation.isPending || (!finalAmt || finalAmt === "0")}
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
            data-testid={`tab-expense-${tab.key}`}
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

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Banknote className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No Expenses Found</p>
            <p className="text-xs text-gray-300">Tap + to submit an expense claim</p>
          </div>
        ) : (
          filtered.map(exp => (
            <div
              key={exp.id}
              className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => { setSelected(exp); setView("detail"); }}
              data-testid={`card-expense-${exp.id}`}
            >
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-green-700 font-semibold">{exp.expenseCode}</p>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{exp.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{exp.type}</p>
                  </div>
                  <StatusPill status={exp.status} />
                </div>
              </div>
              <div className="px-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  {exp.startDate && <span>{fmtDate(exp.startDate)} – {fmtDate(exp.endDate)}</span>}
                  {!exp.startDate && <span>{fmtDate(exp.expenseDate)}</span>}
                </div>
                <p className="text-sm font-bold text-gray-700">
                  Rs. {Number(exp.finalAmount || exp.amount || 0).toLocaleString()}
                </p>
              </div>
              {exp.adminComment && (
                <div className="px-3 py-1.5 border-t border-amber-100 bg-amber-50">
                  <p className="text-[11px] text-amber-700 truncate">{exp.adminComment}</p>
                </div>
              )}
              {exp.modeOfTravel && (
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center gap-1.5">
                  <Gauge className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] text-gray-500">{exp.modeOfTravel}</span>
                  {exp.totalDistance && <span className="text-[11px] text-gray-400">· {exp.totalDistance} km</span>}
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
