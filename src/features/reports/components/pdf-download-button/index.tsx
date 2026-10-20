import { Download } from "lucide-react";
import { useId, useRef, useState } from "react";

import PdfOptionsDialog from "@/features/reports/components/pdf-options-dialog";

import { downloadReportPdf } from "@/features/reports/utils/download-pdf";
import { createReportData, getPdfDownloadIssue } from "@/features/reports/utils/report-data";
import { saveExpensePdfOptions } from "@/features/reports/utils/report-options";

import type {
  ExpensePdfOptions,
  PdfReportData,
  ReportRequest,
} from "@/features/reports/types/reports.types";

import Icon from "@/shared/ui/icon";

interface PropsType {
  request?: ReportRequest;
  disabledReason?: string;
}

const PdfDownloadButton = ({ request, disabledReason }: PropsType) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const busy = useRef(false);
  const availabilityId = useId();
  const availabilityIssue = disabledReason || getPdfDownloadIssue(request);
  let optionsReport: PdfReportData | undefined;
  let optionsIssue = availabilityIssue;
  if (showOptions && request && !optionsIssue) {
    try {
      optionsReport = createReportData(request);
    } catch (failure) {
      optionsIssue = failure instanceof Error ? failure.message : "Could not prepare the PDF data.";
    }
  }

  const handleGenerate = async (options?: ExpensePdfOptions) => {
    if (busy.current) return;
    const issue = getPdfDownloadIssue(request);
    if (issue) throw new Error(issue);
    if (!request) return;
    busy.current = true;
    setDownloading(true);
    setError("");
    try {
      // Compile the click-time snapshot before loading the PDF engine asynchronously.
      const report = createReportData(request, Date.now(), options);
      await downloadReportPdf(report);
      if (request.kind === "expenses" && options) {
        if (!saveExpensePdfOptions(options)) {
          setNotice(
            "PDF generated, but your field choices could not be remembered on this device.",
          );
        }
        setShowOptions(false);
      }
    } finally {
      busy.current = false;
      setDownloading(false);
    }
  };

  const handleDownload = async () => {
    if (!request || busy.current || availabilityIssue || getPdfDownloadIssue(request)) return;
    setError("");
    setNotice("");
    if (request.kind === "expenses") {
      setShowOptions(true);
      return;
    }
    try {
      await handleGenerate();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not download the PDF. Try again.",
      );
    }
  };
  const handleCloseOptions = () => setShowOptions(false);

  return (
    <div className="flex min-w-0 flex-col items-end gap-2">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleDownload}
        disabled={!!availabilityIssue || !request || downloading}
        aria-busy={downloading}
        aria-describedby={availabilityIssue ? availabilityId : undefined}
      >
        <Icon icon={Download} size={18} />
        {downloading ? "Creating PDF…" : "Download PDF"}
      </button>
      {availabilityIssue && (
        <p id={availabilityId} role="status" className="soft-caption max-w-72">
          {availabilityIssue}
        </p>
      )}
      {downloading && (
        <span role="status" className="soft-caption">
          Preparing your report…
        </span>
      )}
      {error && (
        <p role="alert" className="soft-caption money-negative max-w-72">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="soft-caption max-w-72">
          {notice}
        </p>
      )}
      {showOptions && (
        <PdfOptionsDialog
          report={optionsReport}
          unavailableReason={optionsIssue}
          onGenerate={handleGenerate}
          onCancel={handleCloseOptions}
        />
      )}
    </div>
  );
};

export default PdfDownloadButton;
