'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/contexts/PatientsContext';
import { PatientCreate, Gender } from '@/lib/types';
import { Loader2, X } from 'lucide-react';

// ============================================================================
// Validation Schema
// ============================================================================

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone must be less than 50 characters').optional().or(z.literal('')),
  age: z.coerce.number().int().min(0).max(150).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say', 'other'] as const).optional(),
  occupation: z.string().max(200).optional().or(z.literal('')),
  referral_source: z.string().max(200).optional().or(z.literal('')),
});

type PatientFormData = z.infer<typeof patientSchema>;

// ============================================================================
// Props
// ============================================================================

interface AddPatientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function AddPatientSheet({ open, onOpenChange }: AddPatientSheetProps) {
  const { createPatient, loading } = usePatients();
  const [initialConcerns, setInitialConcerns] = useState<string[]>([]);
  const [concernInput, setConcernInput] = useState('');

  // ========================================
  // Form Setup
  // ========================================

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const gender = watch('gender');

  // ========================================
  // Handle Concerns
  // ========================================

  const addConcern = () => {
    const trimmed = concernInput.trim();
    if (trimmed && !initialConcerns.includes(trimmed) && initialConcerns.length < 10) {
      setInitialConcerns([...initialConcerns, trimmed]);
      setConcernInput('');
    }
  };

  const removeConcern = (concern: string) => {
    setInitialConcerns(initialConcerns.filter((c) => c !== concern));
  };

  // ========================================
  // Handle Submit
  // ========================================

  const onSubmit = async (data: PatientFormData) => {
    // Prepare patient data
    const patientData: PatientCreate = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      demographics: {
        age: data.age ? Number(data.age) : undefined,
        gender: data.gender as Gender | undefined,
        occupation: data.occupation || undefined,
        referral_source: data.referral_source || undefined,
        initial_concerns: initialConcerns.length > 0 ? initialConcerns : undefined,
      },
    };

    // Create patient
    const newPatient = await createPatient(patientData);

    if (newPatient) {
      // Reset form
      reset();
      setInitialConcerns([]);
      setConcernInput('');

      // Close sheet
      onOpenChange(false);
    }
  };

  // ========================================
  // Handle Close
  // ========================================

  const handleClose = () => {
    if (!loading) {
      reset();
      setInitialConcerns([]);
      setConcernInput('');
      onOpenChange(false);
    }
  };

  // ========================================
  // Render
  // ========================================

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Patient</SheetTitle>
          <SheetDescription>
            Enter patient information to create a new patient record.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="John Smith"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john.smith@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+1-555-0123"
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Demographics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Demographics</h3>

            {/* Age and Gender Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  {...register('age')}
                  placeholder="32"
                  disabled={loading}
                />
                {errors.age && (
                  <p className="text-sm text-destructive">{errors.age.message}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={gender}
                  onValueChange={(value) => setValue('gender', value as Gender)}
                  disabled={loading}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Occupation */}
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                {...register('occupation')}
                placeholder="Software Engineer"
                disabled={loading}
              />
              {errors.occupation && (
                <p className="text-sm text-destructive">{errors.occupation.message}</p>
              )}
            </div>

            {/* Referral Source */}
            <div className="space-y-2">
              <Label htmlFor="referral_source">Referral Source</Label>
              <Input
                id="referral_source"
                {...register('referral_source')}
                placeholder="Primary Care Physician"
                disabled={loading}
              />
              {errors.referral_source && (
                <p className="text-sm text-destructive">{errors.referral_source.message}</p>
              )}
            </div>
          </div>

          {/* Initial Concerns */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Initial Concerns</h3>
            <p className="text-sm text-muted-foreground">
              Add presenting concerns (max 10)
            </p>

            {/* Concerns Input */}
            <div className="flex gap-2">
              <Input
                value={concernInput}
                onChange={(e) => setConcernInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addConcern();
                  }
                }}
                placeholder="e.g., anxiety, work stress"
                disabled={loading || initialConcerns.length >= 10}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addConcern}
                disabled={loading || !concernInput.trim() || initialConcerns.length >= 10}
              >
                Add
              </Button>
            </div>

            {/* Concerns List */}
            {initialConcerns.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {initialConcerns.map((concern) => (
                  <Badge key={concern} variant="secondary" className="gap-1">
                    {concern}
                    <button
                      type="button"
                      onClick={() => removeConcern(concern)}
                      disabled={loading}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Patient
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
