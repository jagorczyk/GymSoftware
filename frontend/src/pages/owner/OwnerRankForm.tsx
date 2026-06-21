import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { getOwnerRanks, createOwnerRank, updateOwnerRank } from "../../api";
import type { OwnerContext } from "./types";
import { PERMISSION_LABELS, type EmployeePermission } from "../../permissions";
import { OwnerFormLayout, ownerFormCardClassName, ownerFormInputClassName, ownerFormLabelClassName } from "../../components/OwnerFormLayout";
import { PermissionCheckboxGrid } from "../../components/PermissionCheckboxGrid";
import { primaryButtonClassName } from "../../components/formStyles";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as EmployeePermission[];

export function OwnerRankForm({ ctx, mode }: { ctx: OwnerContext; mode: "create" | "edit" }) {
  const { auth, selectedGymId, setError } = ctx;
  const navigate = useNavigate();
  const { rankId } = useParams();

  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<EmployeePermission[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && selectedGymId && rankId) {
      getOwnerRanks(auth, Number(selectedGymId))
        .then((ranks) => {
          const rank = ranks.find((r) => r.id === Number(rankId));
          if (rank) {
            setName(rank.name);
            setSelectedPermissions(rank.permissions);
          } else {
            setError("Nie znaleziono rangi");
            navigate("/owner/ranks");
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Błąd pobierania rangi");
          navigate("/owner/ranks");
        });
    }
  }, [auth, selectedGymId, rankId, mode, setError, navigate]);

  function togglePermission(p: EmployeePermission) {
    setSelectedPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGymId) return;

    if (!name.trim()) {
      setError("Nazwa rangi jest wymagana");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await createOwnerRank(auth, Number(selectedGymId), {
          name,
          permissions: selectedPermissions,
        });
      } else {
        await updateOwnerRank(auth, Number(selectedGymId), Number(rankId), {
          name,
          permissions: selectedPermissions,
        });
      }
      navigate("/owner/ranks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisywania rangi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerFormLayout
      backTo="/owner/ranks"
      title={mode === "create" ? "Nowa ranga" : "Edycja rangi"}
      subtitle="Zdefiniuj nazwę oraz przypisane uprawnienia"
    >
      <form onSubmit={handleSubmit} className={ownerFormCardClassName}>
        <div>
          <label className={ownerFormLabelClassName}>Nazwa rangi</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={ownerFormInputClassName}
            placeholder="np. Menadżer, Trener Personalny..."
          />
        </div>

        <div>
          <label className={`${ownerFormLabelClassName} mb-3`}>Uprawnienia</label>
          <PermissionCheckboxGrid
            items={ALL_PERMISSIONS.map((p) => ({
              key: p,
              label: PERMISSION_LABELS[p],
              selected: selectedPermissions.includes(p),
              onToggle: () => togglePermission(p),
            }))}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className={primaryButtonClassName}>
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : "Zapisz rangę"}
          </button>
        </div>
      </form>
    </OwnerFormLayout>
  );
}
