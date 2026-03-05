import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Code, Palette, LineChart, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker using a compatible CDN for version 4.x
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.mjs";

const roles = [
  { id: "frontend", label: "Frontend Developer", icon: Code },
  { id: "backend", label: "Backend Developer", icon: Code },
  { id: "designer", label: "UI/UX Designer", icon: Palette },
  { id: "pm", label: "Product Manager", icon: Briefcase },
  { id: "data", label: "Data Analyst", icon: LineChart },
  { id: "hr", label: "HR", icon: Users },
  { id: "others", label: "Others (Job Description)", icon: FileText },
];

const difficulties = [
  { id: "beginner", label: "Fresher", desc: "Entry-level questions" },
  { id: "intermediate", label: "Mid-level", desc: "3-5 years experience" },
  { id: "advanced", label: "Senior", desc: "Leadership & deep expertise" },
];

interface InterviewSetupProps {
  onBegin: (role: string, difficulty: string, jobDescription?: string, resumeText?: string) => void;
  onBack: () => void;
}

const InterviewSetup = ({ onBegin, onBack }: InterviewSetupProps) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const isOthers = selectedRole === "others";
  const canBegin = selectedRole && selectedDifficulty && (!isOthers || jobDescription.trim().length > 20);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === "application/pdf";
    const isTXT = file.type === "text/plain";

    if (!isPDF && !isTXT) {
      toast.error("Please upload a .txt or .pdf file.");
      return;
    }

    setIsUploading(true);
    try {
      let text = "";
      if (isPDF) {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      
      if (!text.trim()) {
        throw new Error("Could not extract text from the file.");
      }

      setResumeText(text);
      toast.success(`${file.name} uploaded successfully!`);
    } catch (err) {
      console.error("File read error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-6 text-sm flex items-center gap-1 transition-colors">
          ← Back
        </button>

        <h2 className="text-3xl font-bold text-foreground mb-2">Set Up Your Interview</h2>
        <p className="text-muted-foreground mb-8">Choose your role and difficulty level</p>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Select Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`glass rounded-lg p-4 text-left transition-all hover:border-primary/50 ${
                  selectedRole === role.id ? "border-primary glow" : ""
                }`}
              >
                <role.icon className={`h-5 w-5 mb-2 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${selectedRole === role.id ? "text-foreground" : "text-secondary-foreground"}`}>
                  {role.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isOthers && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Paste Job Description</h3>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here... (minimum 20 characters)"
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </motion.div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Resume (Optional)</h3>
            <label className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1 font-medium">
              <FileText className="h-3 w-3" />
              Upload .txt / .pdf
              <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content or upload a .txt file to help the AI tailor questions to your experience..."
            rows={4}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {resumeText && <p className="text-[10px] text-muted-foreground mt-1 text-right">{resumeText.length} characters loaded</p>}
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Difficulty</h3>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDifficulty(d.id)}
                className={`glass rounded-lg p-4 text-center transition-all hover:border-primary/50 ${
                  selectedDifficulty === d.id ? "border-primary glow" : ""
                }`}
              >
                <span className={`text-sm font-semibold block ${selectedDifficulty === d.id ? "text-foreground" : "text-secondary-foreground"}`}>
                  {d.label}
                </span>
                <span className="text-xs text-muted-foreground">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          disabled={!canBegin || isUploading}
          onClick={() => onBegin(selectedRole, selectedDifficulty, isOthers ? jobDescription : undefined, resumeText || undefined)}
          className="w-full py-6 text-lg glow hover:glow-strong transition-shadow disabled:opacity-40 disabled:shadow-none"
        >
          {isUploading ? "Uploading..." : "Begin Interview"}
          {!isUploading && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </motion.div>
    </section>
  );
};

export default InterviewSetup;
