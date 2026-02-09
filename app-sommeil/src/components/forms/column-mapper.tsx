"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const INTERNAL_FIELDS = [
  { value: "__ignore__", label: "-- Ignorer --" },
  { value: "matricule", label: "Matricule" },
  { value: "lastName", label: "Nom" },
  { value: "firstName", label: "Prenom" },
  { value: "department", label: "Service" },
  { value: "position", label: "Poste" },
  { value: "date", label: "Date" },
  { value: "shiftCode", label: "Code vacation" },
  { value: "startTime", label: "Heure debut" },
  { value: "endTime", label: "Heure fin" },
  { value: "duration", label: "Duree" },
  { value: "breakDuration", label: "Pause" },
];

interface ColumnMapperProps {
  headers: string[];
  sampleRows: string[][];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export function ColumnMapper({
  headers,
  sampleRows,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  function handleChange(header: string, value: string) {
    const newMapping = { ...mapping };
    // If the selected field is already mapped to another header, clear it
    if (value !== "__ignore__") {
      for (const key of Object.keys(newMapping)) {
        if (newMapping[key] === value && key !== header) {
          newMapping[key] = "__ignore__";
        }
      }
    }
    newMapping[header] = value;
    onMappingChange(newMapping);
  }

  const usedFields = new Set(Object.values(mapping).filter((v) => v !== "__ignore__"));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Correspondance des colonnes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {headers.map((header) => {
              const mappedField = mapping[header] ?? "__ignore__";
              const isAutoMapped =
                mappedField !== "__ignore__" && mapping[header] !== undefined;

              return (
                <div
                  key={header}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-2 sm:w-48 shrink-0">
                    <span className="text-sm font-medium truncate">
                      {header}
                    </span>
                    {isAutoMapped && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        auto
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm shrink-0">
                    &rarr;
                  </div>
                  <Select
                    value={mappedField}
                    onValueChange={(v) => handleChange(header, v)}
                  >
                    <SelectTrigger className="w-full sm:w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNAL_FIELDS.map((field) => (
                        <SelectItem
                          key={field.value}
                          value={field.value}
                          disabled={
                            field.value !== "__ignore__" &&
                            usedFields.has(field.value) &&
                            mappedField !== field.value
                          }
                        >
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Apercu des donnees ({sampleRows.length} premieres lignes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {headers.map((h) => {
                    const field = mapping[h];
                    return (
                      <th
                        key={h}
                        className="px-2 py-1.5 text-left font-medium text-xs whitespace-nowrap"
                      >
                        <div>{h}</div>
                        {field && field !== "__ignore__" && (
                          <Badge variant="outline" className="mt-0.5 text-[10px]">
                            {field}
                          </Badge>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b last:border-0">
                    {headers.map((h, colIdx) => (
                      <td
                        key={`${rowIdx}-${colIdx}`}
                        className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap max-w-[200px] truncate"
                      >
                        {row[colIdx] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
