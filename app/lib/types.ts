// Core FamilyOS types. Metadata first: an item records what exists, where it is,
// who knows, who can open it and who handles it. A file attachment is optional.

export type PersonId = string;

export type Category =
  | 'identity' | 'money' | 'insurance' | 'property' | 'legal'
  | 'medical' | 'work' | 'children' | 'digital' | 'bills';

export const CATEGORY_LABELS: Record<Category, string> = {
  identity: 'Identity',
  money: 'Money',
  insurance: 'Insurance',
  property: 'Property & valuables',
  legal: 'Legal',
  medical: 'Medical',
  work: 'Work & benefits',
  children: 'Children',
  digital: 'Digital life',
  bills: 'Things that keep running',
};

export type EmergencyKind = 'medical' | 'death' | 'lost';

export type AfterDeathWish = 'Keep' | 'Transfer' | 'Archive' | 'Memorialise' | 'Close';

export interface Person {
  id: PersonId;
  name: string;
  fullName: string;
  relationship: string;
  /** Has a FamilyOS login and can be shared with. */
  isMember: boolean;
}

export interface Item {
  id: string;
  title: string;
  category: Category;
  ownerId: PersonId;
  /** Login that created it (database items only). */
  createdBy?: string;
  /** Whose life this item concerns (e.g. parents' insurance concerns both parents). */
  concerns: PersonId[];
  /** Where the family would look for it. Empty means not recorded. */
  location: string;
  reference?: string;
  /** ISO date. */
  expiresOn?: string;
  /** ISO date the details were last confirmed. */
  lastVerifiedOn: string;
  knows: PersonId[];
  canOpen: PersonId[];
  responsibleId: PersonId | null;
  backupId: PersonId | null;
  critical: boolean;
  emergencies: EmergencyKind[];
  afterDeath?: AfterDeathWish;
  /** Owner has set this aside for their named successor (PRD §25 emergency pre-authorised). */
  releaseToSuccessor?: boolean;
  notes?: string;
}

export type GapKind =
  | 'unshared' | 'inaccessible' | 'unassigned' | 'no_backup'
  | 'missing_location' | 'expiring' | 'stale';

export interface Gap {
  kind: GapKind;
  severity: 'critical' | 'warning';
  /** Plain-language message shown to families. */
  message: string;
}
