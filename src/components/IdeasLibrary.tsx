import { useMemo, useState, KeyboardEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TIERS, MOCK_USER, MOCK_EARNINGS } from "@/lib/mockData";
import { TierIcon } from "@/components/TierIcon";
import { ChevronDown, Search, Infinity, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Idea = {
  id: string;
  tierId: number;
  name: string;
  concepts: string;
  functionality: string;
  keywords: string[];
  username: string;
  level: number;
  createdAt: string;
};

type InfiniTag = {
  id: string;
  tag: string;
  tierId: number;
  createdAt: string;
};

const SEED_IDEAS: Idea[] = [
  {
    id: "i1",
    tierId: 6,
    name: "Adaptive AI Tutor for Lab Work",
    concepts: "Hands-free voice-guided AI assistant trained on lab protocols.",
    functionality: "Reduces protocol error rates and onboards junior researchers in days, not weeks.",
    keywords: ["#AI", "#labtech", "#tutor"],
    username: "ResearcherX",
    level: 47,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const SEED_TAGS: InfiniTag[] = [
  { id: "t1", tag: "∞RainyDayMorningHappines", tierId: 10, createdAt: new Date().toISOString() },
  { id: "t2", tag: "∞QuantumProcessorLiquidCooling", tierId: 6, createdAt: new Date().toISOString() },
  { id: "t3", tag: "∞PlotTwistNoirMovie", tierId: 9, createdAt: new Date().toISOString() },
  { id: "t4", tag: "∞SustainablePermaculturalProjectAfrica", tierId: 4, createdAt: new Date().toISOString() },
  { id: "t5", tag: "∞PetricoreBodyShampoo", tierId: 13, createdAt: new Date().toISOString() },
  { id: "t6", tag: "∞ConfortabelImpermeableTravellingBodywear", tierId: 14, createdAt: new Date().toISOString() },
];

export function IdeasLibrary() {
  const [open, setOpen] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>(SEED_IDEAS);
  const [tags, setTags] = useState<InfiniTag[]>(SEED_TAGS);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border" style={{ borderColor: "#0E2A47", background: "rgba(255,255,255,0.35)" }}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4" style={{ color: "#0E2A47" }}>
        <span className="text-sm font-semibold inline-flex items-center gap-2">
          <Infinity className="h-4 w-4" /> Ideas Library
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-0 space-y-4">
        <Tabs defaultValue="researchers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="researchers">Researchers</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>

          <TabsContent value="researchers" className="space-y-4 mt-4">
            <SubmitIdeaForm onSubmit={(i) => setIdeas((prev) => [i, ...prev])} />
            <p className="text-[11px] italic text-center" style={{ color: "#0E2A47" }}>
              Yours Ideas will be Protected by Prior Art Rights &amp; Copyright Laws ©. Best/Most Useful Ideas will be Granted a Full Patent Coverage with Minor Percentage Compartecipation from Our Side.
            </p>
            <IdeaList ideas={ideas} />
          </TabsContent>

          <TabsContent value="companies" className="space-y-4 mt-4">
            <CompaniesPanel ideas={ideas} tags={tags} onAddTag={(t) => setTags((prev) => [t, ...prev])} />
          </TabsContent>
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ------------------------------- Researchers ------------------------------ */

function SubmitIdeaForm({ onSubmit }: { onSubmit: (i: Idea) => void }) {
  const [tierId, setTierId] = useState<number>(6);
  const [name, setName] = useState("");
  const [concepts, setConcepts] = useState("");
  const [functionality, setFunctionality] = useState("");
  const [kwInput, setKwInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);

  const addKw = (raw: string) => {
    const parts = raw.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    setKeywords((prev) => Array.from(new Set([...prev, ...parts.map((p) => (p.startsWith("#") ? p : `#${p}`))])));
    setKwInput("");
  };
  const onKwKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKw(kwInput);
    }
  };

  const submit = () => {
    if (!name.trim()) {
      toast({ title: "Idea name required" });
      return;
    }
    onSubmit({
      id: crypto.randomUUID(),
      tierId,
      name: name.trim(),
      concepts: concepts.trim(),
      functionality: functionality.trim(),
      keywords,
      username: "You",
      level: MOCK_EARNINGS.level,
      createdAt: new Date().toISOString(),
    });
    setName("");
    setConcepts("");
    setFunctionality("");
    setKeywords([]);
    toast({ title: "Idea submitted", description: "Visible to companies in the library." });
  };

  return (
    <Card className="border" style={{ borderColor: "#0E2A47", background: "rgba(255,255,255,0.6)" }}>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: "#0E2A47" }}>Submit New Ideas</h3>

        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#0E2A47" }}>Interest Tier</label>
          <select
            value={tierId}
            onChange={(e) => setTierId(Number(e.target.value))}
            className="w-full rounded-md px-3 py-2 text-sm border bg-white"
            style={{ borderColor: "#0E2A47", color: "#0E2A47" }}
          >
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#0E2A47" }}>Idea Name (max 80)</label>
          <Input
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="bg-white"
            style={{ color: "#0E2A47", borderColor: "#0E2A47" }}
            placeholder="A concise, descriptive title"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#0E2A47" }}>Core Concepts (max 600)</label>
          <Textarea
            value={concepts}
            maxLength={600}
            onChange={(e) => setConcepts(e.target.value)}
            className="bg-white min-h-[90px]"
            style={{ color: "#0E2A47", borderColor: "#0E2A47" }}
            placeholder="What is the idea, fundamentally?"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#0E2A47" }}>Functionality / Sector Improvements (max 400)</label>
          <Textarea
            value={functionality}
            maxLength={400}
            onChange={(e) => setFunctionality(e.target.value)}
            className="bg-white min-h-[80px]"
            style={{ color: "#0E2A47", borderColor: "#0E2A47" }}
            placeholder="How would this improve or enhance your sector?"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#0E2A47" }}>Keywords (Enter or comma to add)</label>
          <Input
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={onKwKeyDown}
            onBlur={() => kwInput && addKw(kwInput)}
            className="bg-white"
            style={{ color: "#0E2A47", borderColor: "#0E2A47" }}
            placeholder="quantum, fusion, sustainability"
          />
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#0E2A47", color: "#d1defb" }}>
                  {k}
                  <button onClick={() => setKeywords((prev) => prev.filter((x) => x !== k))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button onClick={submit} className="w-full bg-money hover:bg-money text-white">Submit New Ideas</Button>
      </CardContent>
    </Card>
  );
}

function IdeaList({ ideas }: { ideas: Idea[] }) {
  if (!ideas.length) return <p className="text-xs text-center" style={{ color: "#0E2A47" }}>No ideas yet — be the first.</p>;
  return (
    <div className="space-y-2">
      {ideas.map((i) => <IdeaRow key={i.id} idea={i} />)}
    </div>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  const [open, setOpen] = useState(false);
  const tier = TIERS.find((t) => t.id === idea.tierId)!;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border" style={{ borderColor: "#0E2A47", background: "rgba(255,255,255,0.5)" }}>
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 p-3 text-left" style={{ color: "#0E2A47" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: tier.color }}><TierIcon tierId={tier.id} size={20} /></span>
          <span className="text-sm font-semibold truncate">{idea.name}</span>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-2 text-xs" style={{ color: "#0E2A47" }}>
        <div><strong>Tier:</strong> {tier.name}</div>
        {idea.concepts && <div><strong>Core Concepts:</strong> {idea.concepts}</div>}
        {idea.functionality && <div><strong>Functionality:</strong> {idea.functionality}</div>}
        {idea.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {idea.keywords.map((k) => (
              <span key={k} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#0E2A47", color: "#d1defb" }}>{k}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#0E2A47" }}>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-bold">f</span>
            <span className="font-bold">in</span>
          </div>
          <span className="text-[11px] font-semibold">{idea.username} · Lv {idea.level}</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* -------------------------------- Companies ------------------------------- */

function CompaniesPanel({
  ideas,
  tags,
  onAddTag,
}: {
  ideas: Idea[];
  tags: InfiniTag[];
  onAddTag: (t: InfiniTag) => void;
}) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tagTier, setTagTier] = useState<number>(6);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ideas.filter((i) => {
      const matchT = tierFilter == null || i.tierId === tierFilter;
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.keywords.some((k) => k.toLowerCase().includes(q));
      return matchT && matchQ;
    });
  }, [ideas, search, tierFilter]);

  const submitTag = () => {
    const cleaned = tagInput.replace(/\s+/g, "").replace(/^∞+/, "");
    if (!cleaned) {
      toast({ title: "Tag required" });
      return;
    }
    onAddTag({
      id: crypto.randomUUID(),
      tag: `∞${cleaned}`,
      tierId: tagTier,
      createdAt: new Date().toISOString(),
    });
    setTagInput("");
    toast({ title: "∞InfiniTag posted", description: "Visible on the noticeboard." });
  };

  return (
    <div className="space-y-4">
      <Card className="border" style={{ borderColor: "#0E2A47", background: "rgba(255,255,255,0.6)" }}>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: "#0E2A47" }}>Search Researcher Ideas</h3>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "#0E2A47" }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or keyword"
              className="bg-white pl-8"
              style={{ color: "#0E2A47", borderColor: "#0E2A47" }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTierFilter(null)}
              className={`text-[11px] px-2 py-1 rounded-full border whitespace-nowrap ${tierFilter == null ? "font-bold" : ""}`}
              style={{ borderColor: "#0E2A47", color: "#0E2A47", background: tierFilter == null ? "#d1defb" : "transparent" }}
            >
              All
            </button>
            {TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTierFilter(t.id)}
                title={t.name}
                className="shrink-0 p-1.5 rounded-full border"
                style={{
                  borderColor: tierFilter === t.id ? t.color : "#0E2A47",
                  color: t.color,
                  background: tierFilter === t.id ? "#d1defb" : "transparent",
                }}
              >
                <TierIcon tierId={t.id} size={18} />
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center" style={{ color: "#0E2A47" }}>No matches.</p>
            ) : (
              filtered.map((i) => <IdeaRow key={i.id} idea={i} />)
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border" style={{ borderColor: "#0E2A47", background: "rgba(255,255,255,0.6)" }}>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: "#0E2A47" }}>
            <Infinity className="h-4 w-4" /> Submit ∞InfiniTag
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="∞YourConceptHere (no spaces)"
              className="bg-white"
              style={{ color: "#0E2A47", borderColor: "#0E2A47" }}
            />
            <select
              value={tagTier}
              onChange={(e) => setTagTier(Number(e.target.value))}
              className="rounded-md px-2 py-2 text-xs border bg-white"
              style={{ borderColor: "#0E2A47", color: "#0E2A47" }}
            >
              {TIERS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={submitTag} className="flex-1 bg-money hover:bg-money text-white">Post Tag</Button>
            <Button
              onClick={() => toast({ title: "Purchase Tags", description: "Tag purchased — 10$/Week or 1 Token / 1% Interest (mock)." })}
              variant="outline"
              className="flex-1"
              style={{ borderColor: "#0E2A47", color: "#0E2A47", background: "white" }}
            >
              Purchase Tags
            </Button>
          </div>

          <div className="pt-3">
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "#0E2A47" }}>∞InfiniTag Noticeboard</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tags.map((t) => {
                const tier = TIERS.find((x) => x.id === t.tierId)!;
                return (
                  <div key={t.id} className="rounded-md border p-2 flex items-center gap-2" style={{ borderColor: "#0E2A47", background: "white" }}>
                    <span style={{ color: tier.color }}><TierIcon tierId={tier.id} size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: "#0E2A47" }}>{t.tag}</p>
                      <p className="text-[10px] truncate" style={{ color: "#0E2A47", opacity: 0.7 }}>{tier.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
