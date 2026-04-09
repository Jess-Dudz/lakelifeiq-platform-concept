'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { upgrades, type UpgradeItem } from '../data/upgrades';
import { boats, type Boat } from '../data/boats';

const budgetBands = ['30-60', '60-90', '90-150', '150+'] as const;
type BudgetBand = (typeof budgetBands)[number];

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function isBudgetBand(value: string): value is BudgetBand {
  return budgetBands.includes(value as BudgetBand);
}

function getBudgetLabel(budgetBand: string) {
  return budgetBand === '30-60'
    ? '$30k–$60k'
    : budgetBand === '60-90'
    ? '$60k–$90k'
    : budgetBand === '90-150'
    ? '$90k–$150k'
    : '$150k+';
}

function formatBudgetBands(bands: string[]) {
  if (bands.length === 0) return 'No upgrade budget allowance';
  if (bands.length === 1) return getBudgetLabel(bands[0]);

  return bands.map(getBudgetLabel).join(', ');
}

function getRemainingUpgradeBudgetBands(
  selectedTotalBudget: string,
  recommendedBoatBudget?: string
) {
  if (!isBudgetBand(selectedTotalBudget)) return [];
  if (!recommendedBoatBudget || !isBudgetBand(recommendedBoatBudget)) {
    return [selectedTotalBudget];
  }

  const totalIndex = budgetBands.indexOf(selectedTotalBudget);
  const boatIndex = budgetBands.indexOf(recommendedBoatBudget);

  if (boatIndex > totalIndex) {
    return [];
  }

  if (selectedTotalBudget === '30-60') {
    return [];
  }

  if (selectedTotalBudget === '60-90') {
    return ['30-60'];
  }

  if (selectedTotalBudget === '90-150') {
    return recommendedBoatBudget === '30-60' ? ['30-60', '60-90'] : ['30-60'];
  }

  if (
    recommendedBoatBudget === '30-60' ||
    recommendedBoatBudget === '60-90'
  ) {
    return ['30-60', '60-90', '90-150'];
  }

  return ['30-60', '60-90', '90-150'];
}

function normalizeDockType(value: string) {
  return normalizeValue(value.replace(/\s+with seating area$/i, ''));
}

function dockTypeHasSeating(value: string) {
  return /seating area/i.test(value);
}

function matchesDockType(selectedValue: string, candidateValues?: string[]) {
  if (!candidateValues || candidateValues.length === 0) return true;

  return candidateValues
    .map(normalizeDockType)
    .includes(normalizeDockType(selectedValue));
}

function matchesOneOf(selectedValues: string[], candidateValues?: string[]) {
  if (!candidateValues || candidateValues.length === 0) return true;

  const normalizedSelected = selectedValues.map(normalizeValue);
  return candidateValues.some((value) =>
    normalizedSelected.includes(normalizeValue(value))
  );
}

function matchesSingleValue(selectedValue: string, candidateValues?: string[]) {
  if (!candidateValues || candidateValues.length === 0) return true;

  return candidateValues
    .map(normalizeValue)
    .includes(normalizeValue(selectedValue));
}

function hasSelectedPriority(
  selectedPriorities: string[],
  expectedPriority: string
) {
  return selectedPriorities.some(
    (priority) => normalizeValue(priority) === normalizeValue(expectedPriority)
  );
}

function matchesPrimaryUsage(boat: Boat, selectedUsage: string) {
  return boat.usage
    .map(normalizeValue)
    .includes(normalizeValue(selectedUsage));
}

function isLiftUpgrade(item: UpgradeItem) {
  return Boolean(item.lift);
}

function isCoverUpgrade(item: UpgradeItem) {
  return item.category === 'Cover';
}

function buildDealersHref(lake: string, category: string) {
  const params = new URLSearchParams();
  params.set('lake', lake);
  params.set('category', category);
  return `/dealers?${params.toString()}`;
}

function isAutomaticCover(item: UpgradeItem) {
  return Boolean(
    item.cover && normalizeValue(item.cover.coverType).includes('automatic')
  );
}

function getLiftAutomationRank(item: UpgradeItem) {
  const automationLevel = item.lift?.automationLevel;

  if (automationLevel === 'automatic') return 2;
  if (automationLevel === 'assisted') return 1;
  return 0;
}

function matchesLiftAutomationPreference(
  item: UpgradeItem,
  selectedLiftAutomationPreference: string
) {
  if (!isLiftUpgrade(item)) return true;
  if (selectedLiftAutomationPreference !== 'required') return true;
  return getLiftAutomationRank(item) >= 1;
}

function matchesCoverAutomationPreference(
  item: UpgradeItem,
  selectedCoverAutomationPreference: string
) {
  if (!isCoverUpgrade(item)) return true;
  if (selectedCoverAutomationPreference !== 'required') return true;
  return isAutomaticCover(item);
}

function isUpgradeSuppressedByNeed(
  item: UpgradeItem,
  selectedLiftNeed: string,
  selectedCoverNeed: string
) {
  return (
    (selectedLiftNeed === 'not-needed' && isLiftUpgrade(item)) ||
    (selectedCoverNeed === 'not-needed' && isCoverUpgrade(item))
  );
}

function isRequiredUpgradeType(
  item: UpgradeItem,
  selectedLiftNeed: string,
  selectedLiftAutomationPreference: string,
  selectedCoverNeed: string,
  selectedCoverAutomationPreference: string
) {
  return (
    ((selectedLiftNeed === 'required' ||
      selectedLiftAutomationPreference === 'required') &&
      isLiftUpgrade(item)) ||
    ((selectedCoverNeed === 'required' ||
      selectedCoverAutomationPreference === 'required') &&
      isCoverUpgrade(item))
  );
}

function buildUpgradeReasons(
  item: UpgradeItem,
  selectedLake: string,
  selectedUsage: string,
  selectedDockType: string,
  selectedLiftAutomationPreference: string,
  selectedPriorities: string[],
  remainingUpgradeBudgetBands: string[],
  selectedGoal: string,
  remainingUpgradeBudgetLabel: string,
  recommendedBoatName: string | null
) {
  const reasons: string[] = [];

  if (
    isLiftUpgrade(item) &&
    (selectedLiftAutomationPreference === 'preferred' ||
      selectedLiftAutomationPreference === 'required') &&
    getLiftAutomationRank(item) >= 1
  ) {
    reasons.push('Supports your preference for easier daily lift use');
  }

  if (item.match.priorities?.length) {
    const matchedPriorities = item.match.priorities.filter((priority) =>
      selectedPriorities
        .map(normalizeValue)
        .includes(normalizeValue(priority))
    );

    if (matchedPriorities.length > 0) {
      reasons.push(`Matches your priority: ${matchedPriorities.join(', ')}`);
    }
  }

  if (
    item.match.lake &&
    item.match.lake.map(normalizeValue).includes(normalizeValue(selectedLake))
  ) {
    reasons.push(`Available around your lake: ${selectedLake}`);
  }

  if (
    item.match.usage &&
    item.match.usage.map(normalizeValue).includes(normalizeValue(selectedUsage))
  ) {
    reasons.push(`Fits your primary usage: ${selectedUsage}`);
  }

  if (
    selectedDockType &&
    item.match.dockType &&
    matchesDockType(selectedDockType, item.match.dockType)
  ) {
    reasons.push(`Works with your dock setup: ${selectedDockType}`);
  }

  if (
    remainingUpgradeBudgetBands.length > 0 &&
    item.match.budget &&
    item.match.budget.some((budgetBand) =>
      remainingUpgradeBudgetBands.includes(budgetBand)
    )
  ) {
    reasons.push(
      `Fits after ${recommendedBoatName ?? 'your recommended boat'} within the remaining setup budget: ${remainingUpgradeBudgetLabel}`
    );
  }

  if (
    item.match.goal &&
    item.match.goal.map(normalizeValue).includes(normalizeValue(selectedGoal))
  ) {
    reasons.push(`Supports your goal: ${selectedGoal}`);
  }

  return reasons.slice(0, 3);
}

function buildBoatReasons(
  boat: Boat,
  selectedUsage: string,
  selectedDockType: string,
  selectedPriorities: string[],
  budgetLabel: string
) {
  const reasons: string[] = [];

  reasons.push(`Fits your primary usage: ${selectedUsage}`);

  if (
    selectedDockType &&
    boat.dockCompatibility &&
    matchesDockType(selectedDockType, boat.dockCompatibility)
  ) {
    reasons.push(`Compatible with your dock setup: ${selectedDockType}`);
  }

  if (
    hasSelectedPriority(selectedPriorities, 'Automation / Convenience') &&
    boat.easyDockAccess
  ) {
    reasons.push('Supports a convenience-focused ownership experience');
  }

  if (
    hasSelectedPriority(selectedPriorities, 'Low Maintenance') &&
    boat.lowMaintenance
  ) {
    reasons.push('Matches your low-maintenance preference');
  }

  if (hasSelectedPriority(selectedPriorities, 'Performance') && boat.performance) {
    reasons.push('Strong fit for performance-oriented buyers');
  }

  if (hasSelectedPriority(selectedPriorities, 'Comfort') && boat.comfort) {
    reasons.push('Delivers stronger comfort for longer lake days');
  }

  if (
    hasSelectedPriority(selectedPriorities, 'Family Friendly') &&
    boat.familyFriendly
  ) {
    reasons.push('Well suited for family-focused lake use');
  }

  if (boat.bestFor?.length) {
    const matchedBestFor = boat.bestFor.filter((tag) =>
      selectedPriorities
        .concat([selectedUsage])
        .map(normalizeValue)
        .includes(normalizeValue(tag))
    );

    if (matchedBestFor.length > 0) {
      reasons.push(`Especially strong for: ${matchedBestFor.join(', ')}`);
    }
  }

  reasons.push(`Sits in the recommended budget band: ${budgetLabel}`);

  return reasons.slice(0, 4);
}

const categoryOrder = ['Cover', 'Dock', 'Comfort', 'Performance'];

export default function ResultsPage() {
  const searchParams = useSearchParams();

  const selectedLake = searchParams.get('lake') ?? 'Lake of the Ozarks';
  const selectedUsage = searchParams.get('usage') ?? 'Wakeboarding';
  const selectedBudget = searchParams.get('budget') ?? '60-90';
  const selectedDockType = searchParams.get('dockType') ?? '';
  const selectedDockSeatingArea = searchParams.get('dockSeatingArea');
  const selectedLiftNeed = searchParams.get('liftNeed') ?? 'optional';
  const selectedCoverNeed = searchParams.get('coverNeed') ?? 'optional';
  const selectedLiftAutomationPreference =
    searchParams.get('liftAutomationPreference') ?? 'no-preference';
  const selectedCoverAutomationPreference =
    searchParams.get('coverAutomationPreference') ?? 'no-preference';
  const selectedGoal = searchParams.get('goal') ?? 'Buy new';
  const selectedPriorities = (searchParams.get('priorities') ?? '')
    .split('|')
    .filter(Boolean);
  const selectedDockHasSeating =
    selectedDockSeatingArea !== null
      ? normalizeValue(selectedDockSeatingArea) === 'yes'
      : dockTypeHasSeating(selectedDockType);

  const [openBoatId, setOpenBoatId] = useState<string | null>(null);
  const [showUpgradeDetails, setShowUpgradeDetails] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState('');

  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const budgetLabel =
    getBudgetLabel(selectedBudget);

  const recommendations = useMemo(() => {
    // Usage is a hard gate: only boats explicitly tagged for the selected
    // primary usage can be ranked or shown.
    const usageQualifiedBoats = boats.filter((boat) =>
      matchesPrimaryUsage(boat, selectedUsage)
    );

    return usageQualifiedBoats
      .map((boat) => {
        let score = 0;

        if (boat.budget === selectedBudget) score += 3;

        if (
          selectedDockType &&
          boat.dockCompatibility &&
          matchesDockType(selectedDockType, boat.dockCompatibility)
        ) {
          score += 2;
        }

        if (
          hasSelectedPriority(selectedPriorities, 'Automation / Convenience') &&
          boat.easyDockAccess
        ) {
          score += 2;
        }

        if (
          hasSelectedPriority(selectedPriorities, 'Low Maintenance') &&
          boat.lowMaintenance
        ) {
          score += 2;
        }

        if (
          hasSelectedPriority(selectedPriorities, 'Performance') &&
          boat.performance
        ) {
          score += 2;
        }

        if (hasSelectedPriority(selectedPriorities, 'Comfort') && boat.comfort) {
          score += 2;
        }

        if (
          hasSelectedPriority(selectedPriorities, 'Family Friendly') &&
          boat.familyFriendly
        ) {
          score += 2;
        }

        if (selectedGoal === 'Buy new' && boat.upgradePotential) {
          score += 1;
        }

        if (boat.luxuryTier === 'premium' && selectedBudget === '150+') {
          score += 1;
        }

        return {
          ...boat,
          score,
          reasons: buildBoatReasons(
            boat,
            selectedUsage,
            selectedDockType,
            selectedPriorities,
            budgetLabel
          ),
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.model.localeCompare(b.model);
      });
  }, [
    selectedUsage,
    selectedBudget,
    selectedDockType,
    selectedPriorities,
    selectedGoal,
    budgetLabel,
  ]);

  const topRecommendation = recommendations[0];
  const alternateRecommendations = recommendations.slice(1, 3);
  const recommendedBoatName = topRecommendation
    ? `${topRecommendation.brand} ${topRecommendation.model}`
    : null;
  const remainingUpgradeBudgetBands = useMemo(
    () =>
      getRemainingUpgradeBudgetBands(selectedBudget, topRecommendation?.budget),
    [selectedBudget, topRecommendation?.budget]
  );
  const remainingUpgradeBudgetLabel = useMemo(
    () => formatBudgetBands(remainingUpgradeBudgetBands),
    [remainingUpgradeBudgetBands]
  );

  const recommendedUpgrades = useMemo(() => {
    return upgrades
      .map((item: UpgradeItem) => {
        const isSuppressedByNeed = isUpgradeSuppressedByNeed(
          item,
          selectedLiftNeed,
          selectedCoverNeed
        );
        const matchesLiftAutomation = matchesLiftAutomationPreference(
          item,
          selectedLiftAutomationPreference
        );
        const matchesCoverAutomation = matchesCoverAutomationPreference(
          item,
          selectedCoverAutomationPreference
        );
        const matchesLake = matchesSingleValue(selectedLake, item.match.lake);
        const matchesUsage = matchesSingleValue(selectedUsage, item.match.usage);
        const dockTypeMatches = matchesDockType(
          selectedDockType,
          item.match.dockType
        );
        const matchesPriorities = matchesOneOf(
          selectedPriorities,
          item.match.priorities
        );
        const matchesRemainingBudget =
          remainingUpgradeBudgetBands.length > 0 &&
          matchesOneOf(remainingUpgradeBudgetBands, item.match.budget);
        const matchesProjectBudget = matchesSingleValue(
          selectedBudget,
          item.match.budget
        );
        const matchesGoal = matchesSingleValue(selectedGoal, item.match.goal);
        const matchesSeating =
          !item.match.requiresSeating || selectedDockHasSeating;

        const isMatch =
          !isSuppressedByNeed &&
          matchesLiftAutomation &&
          matchesCoverAutomation &&
          matchesLake &&
          matchesUsage &&
          dockTypeMatches &&
          matchesPriorities &&
          matchesRemainingBudget &&
          matchesGoal &&
          matchesSeating;

        let score = 0;
        if (matchesPriorities) score += 3;
        if (matchesUsage) score += 2;
        if (dockTypeMatches) score += 2;
        if (matchesRemainingBudget) score += 2;
        if (matchesProjectBudget) score += 1;
        if (matchesGoal) score += 1;
        if (matchesLake) score += item.match.lake?.length ? 1 : 0;
        if (matchesSeating) score += item.match.requiresSeating ? 1 : 0;
        if (
          selectedLiftAutomationPreference === 'preferred' &&
          isLiftUpgrade(item)
        ) {
          score += getLiftAutomationRank(item);
        }
        if (
          selectedCoverAutomationPreference === 'preferred' &&
          isAutomaticCover(item)
        ) {
          score += 2;
        }

        return {
          ...item,
          score,
          isMatch,
          reasons: buildUpgradeReasons(
            item,
            selectedLake,
            selectedUsage,
            selectedDockType,
            selectedLiftAutomationPreference,
            selectedPriorities,
            remainingUpgradeBudgetBands,
            selectedGoal,
            remainingUpgradeBudgetLabel,
            recommendedBoatName
          ),
        };
      })
      .filter((item) => item.isMatch)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.title.localeCompare(b.title);
      });
  }, [
    selectedLake,
    selectedUsage,
    selectedDockType,
    selectedDockHasSeating,
    selectedLiftNeed,
    selectedCoverNeed,
    selectedLiftAutomationPreference,
    selectedCoverAutomationPreference,
    selectedPriorities,
    selectedBudget,
    selectedGoal,
    remainingUpgradeBudgetBands,
    remainingUpgradeBudgetLabel,
    recommendedBoatName,
  ]);

  const requiredOutsideBudgetUpgrades = useMemo(() => {
    return upgrades
      .map((item: UpgradeItem) => {
        const isSuppressedByNeed = isUpgradeSuppressedByNeed(
          item,
          selectedLiftNeed,
          selectedCoverNeed
        );
        const isRequiredType = isRequiredUpgradeType(
          item,
          selectedLiftNeed,
          selectedLiftAutomationPreference,
          selectedCoverNeed,
          selectedCoverAutomationPreference
        );
        const matchesLiftAutomation = matchesLiftAutomationPreference(
          item,
          selectedLiftAutomationPreference
        );
        const matchesCoverAutomation = matchesCoverAutomationPreference(
          item,
          selectedCoverAutomationPreference
        );
        const matchesLake = matchesSingleValue(selectedLake, item.match.lake);
        const matchesUsage = matchesSingleValue(selectedUsage, item.match.usage);
        const dockTypeMatches = matchesDockType(
          selectedDockType,
          item.match.dockType
        );
        const matchesPriorities = matchesOneOf(
          selectedPriorities,
          item.match.priorities
        );
        const matchesRemainingBudget =
          remainingUpgradeBudgetBands.length > 0 &&
          matchesOneOf(remainingUpgradeBudgetBands, item.match.budget);
        const matchesGoal = matchesSingleValue(selectedGoal, item.match.goal);
        const matchesSeating =
          !item.match.requiresSeating || selectedDockHasSeating;

        const shouldSurface =
          !isSuppressedByNeed &&
          isRequiredType &&
          matchesLiftAutomation &&
          matchesCoverAutomation &&
          matchesLake &&
          matchesUsage &&
          dockTypeMatches &&
          matchesPriorities &&
          matchesGoal &&
          matchesSeating &&
          !matchesRemainingBudget;

        const reasons = [
          isLiftUpgrade(item)
            ? selectedLiftAutomationPreference === 'required'
              ? 'You marked an easier-to-use lift setup as required for this setup'
              : 'You marked a lift as required for this setup'
            : selectedCoverAutomationPreference === 'required'
            ? 'You marked an automatic cover as required for this setup'
            : 'You marked a cover as required for this setup',
          `This option likely needs to be budgeted separately from ${recommendedBoatName ?? 'your recommended boat'}`,
        ];

        if (item.match.lake?.length) {
          reasons.push(`Available around your lake: ${selectedLake}`);
        } else if (item.match.dockType?.length && selectedDockType) {
          reasons.push(`Works with your dock setup: ${selectedDockType}`);
        }

        return {
          ...item,
          shouldSurface,
          reasons,
        };
      })
      .filter((item) => item.shouldSurface)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [
    selectedLake,
    selectedUsage,
    selectedDockType,
    selectedDockHasSeating,
    selectedLiftNeed,
    selectedCoverNeed,
    selectedLiftAutomationPreference,
    selectedCoverAutomationPreference,
    selectedPriorities,
    selectedGoal,
    remainingUpgradeBudgetBands,
    recommendedBoatName,
  ]);

  const groupedUpgrades = useMemo(() => {
    const grouped = recommendedUpgrades.reduce<
      Record<
        string,
        (UpgradeItem & {
          score: number;
          isMatch: boolean;
          reasons: string[];
        })[]
      >
    >((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);

      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [recommendedUpgrades]);

  const dealersCategory = useMemo(() => {
    const allUpgradeCandidates = [
      ...recommendedUpgrades,
      ...requiredOutsideBudgetUpgrades,
    ];

    const hasLiftOptions = allUpgradeCandidates.some((item) => isLiftUpgrade(item));
    const hasCoverOptions = allUpgradeCandidates.some((item) => isCoverUpgrade(item));
    const hasComfortOptions = allUpgradeCandidates.some(
      (item) => item.category === 'Comfort'
    );

    if (
      (selectedLiftNeed === 'required' ||
        selectedLiftAutomationPreference === 'required') &&
      hasLiftOptions
    ) {
      return 'lifts';
    }

    if (
      (selectedCoverNeed === 'required' ||
        selectedCoverAutomationPreference === 'required') &&
      hasCoverOptions
    ) {
      return 'covers';
    }

    if (selectedDockHasSeating && hasComfortOptions) {
      return 'comfort';
    }

    return 'boats';
  }, [
    recommendedUpgrades,
    requiredOutsideBudgetUpgrades,
    selectedLiftNeed,
    selectedLiftAutomationPreference,
    selectedCoverNeed,
    selectedCoverAutomationPreference,
    selectedDockHasSeating,
  ]);
  const dealersHref = useMemo(
    () => buildDealersHref(selectedLake, dealersCategory),
    [selectedLake, dealersCategory]
  );

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    setLeadError('');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          notes: leadForm.notes,
          lake: selectedLake,
          usage: selectedUsage,
          budget: budgetLabel,
          dockType: selectedDockType,
          goal: selectedGoal,
          priorities: selectedPriorities.join(', '),
          recommendedBoat: topRecommendation
            ? `${topRecommendation.brand} ${topRecommendation.model}`
            : 'No exact recommendation',
          recommendedBudget: topRecommendation
            ? topRecommendation.budget === '30-60'
              ? '$30k–$60k'
              : topRecommendation.budget === '60-90'
              ? '$60k–$90k'
              : topRecommendation.budget === '90-150'
              ? '$90k–$150k'
              : '$150k+'
            : budgetLabel,
        }),
      });

      const rawText = await response.text();

      let result: { success?: boolean; error?: string } = {};

      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Failed to parse Apps Script response:', parseError);
        setLeadError('Could not read the server response. Please try again.');
        return;
      }

      if (result.success) {
        setLeadSuccess(true);
        setLeadForm({
          name: '',
          email: '',
          phone: '',
          notes: '',
        });
      } else {
        setLeadError(
          result.error || 'Something went wrong saving your results.'
        );
      }
    } catch (error) {
      console.error('Lead submit error:', error);
      setLeadError('Something went wrong sending your results.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 md:px-6 md:py-14">
      <img
        src="/lake-bg2.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f4d]/55 via-[#0b1f4d]/45 to-[#0b1f4d]/65" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="rounded-[40px] bg-white/55 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-lg md:p-6">
          <div className="rounded-[32px] border border-white/50 bg-white/95 px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:px-8 md:py-8">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <p className="mb-4 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Results
                </p>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#132a72] md:text-5xl">
                  Your Personalized Setup Plan
                </h1>

                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-700">
                  Based on your inputs, here’s the setup that best fits how you
                  actually use the lake.
                </p>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Lake
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedLake}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Usage
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedUsage}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Budget
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {budgetLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Goal
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedGoal}
                  </p>
                </div>
              </div>

              {selectedPriorities.length > 0 && (
                <div className="mb-10">
                  <p className="mb-3 text-sm font-semibold text-[#132a72]">
                    Your priorities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPriorities.map((priority) => (
                      <span
                        key={priority}
                        className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700"
                      >
                        {priority}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {topRecommendation ? (
                <div className="space-y-8">
                  <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                    <div className="h-2 bg-cyan-500" />

                    <div className="p-8">
                      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-700">
                            Top recommendation
                          </p>
                          <h2 className="text-3xl font-bold text-[#132a72] md:text-4xl">
                            {topRecommendation.brand} {topRecommendation.model}
                          </h2>
                          <p className="mt-2 text-sm text-gray-500">
                            {topRecommendation.family} • {topRecommendation.modelYears} •{' '}
                            {topRecommendation.luxuryTier} tier
                          </p>
                        </div>

                        <div className="shrink-0 rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72]">
                          {topRecommendation.score >= 8
                            ? 'Top Match'
                            : topRecommendation.score >= 5
                            ? 'Strong Fit'
                            : 'Consider'}
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <p className="mb-2 text-sm font-semibold text-cyan-600">
                            Budget range
                          </p>
                          <p className="text-lg font-bold text-[#132a72]">
                            {topRecommendation.budget === '30-60'
                              ? '$30k–$60k'
                              : topRecommendation.budget === '60-90'
                              ? '$60k–$90k'
                              : topRecommendation.budget === '90-150'
                              ? '$90k–$150k'
                              : '$150k+'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <p className="mb-2 text-sm font-semibold text-cyan-600">
                            Best for
                          </p>
                          <p className="text-lg font-bold text-[#132a72]">
                            {selectedUsage}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="mb-3 text-xl font-bold text-[#132a72]">
                          Why this fits you
                        </h3>
                        <ul className="space-y-3 text-gray-700">
                          {topRecommendation.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="mt-0.5 text-cyan-600">✔</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={dealersHref}
                          className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg active:scale-[0.98]"
                        >
                          Find Dealers Near You
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenBoatId(
                              openBoatId === topRecommendation.id
                                ? null
                                : topRecommendation.id
                            )
                          }
                          className="rounded-full bg-[#eef7fb] px-6 py-3 font-semibold text-[#132a72] transition-all duration-200 hover:bg-cyan-100"
                        >
                          {openBoatId === topRecommendation.id
                            ? 'Hide details'
                            : 'Expand details'}
                        </button>
                      </div>

                      {openBoatId === topRecommendation.id && (
                        <div className="mt-6 rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <h3 className="mb-3 text-lg font-bold text-[#132a72]">
                            Additional detail
                          </h3>
                          <ul className="space-y-2 text-sm text-gray-700">
                            {topRecommendation.notes.map((note, i) => (
                              <li key={i}>• {note}</li>
                            ))}
                            {topRecommendation.bestFor?.length ? (
                              <li>
                                • Best for: {topRecommendation.bestFor.join(', ')}
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>

                  {alternateRecommendations.length > 0 && (
                    <section>
                      <h3 className="mb-4 text-2xl font-bold text-[#132a72]">
                        Other options to consider
                      </h3>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {alternateRecommendations.map((boat) => (
                          <div
                            key={boat.id}
                            className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)]"
                          >
                            <div className="h-2 bg-cyan-500" />
                            <div className="p-6">
                              <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
                                  <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-cyan-700">
                                    Alternate recommendation
                                  </p>
                                  <h4 className="text-2xl font-bold text-[#132a72]">
                                    {boat.brand} {boat.model}
                                  </h4>
                                  <p className="mt-2 text-sm text-gray-500">
                                    {boat.family} • {boat.modelYears}
                                  </p>
                                </div>

                                <div className="rounded-full bg-[#eef7fb] px-3 py-1 text-sm font-semibold text-[#132a72]">
                                  {boat.score >= 8
                                    ? 'Top Match'
                                    : boat.score >= 5
                                    ? 'Strong Fit'
                                    : 'Consider'}
                                </div>
                              </div>

                              <ul className="space-y-2 text-sm text-gray-700">
                                {boat.reasons.slice(0, 3).map((reason, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="mt-0.5 text-cyan-600">
                                      ✔
                                    </span>
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                    <div className="h-2 bg-cyan-500" />

                    <div className="p-8">
                      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <h3 className="text-2xl font-bold text-[#132a72]">
                          Recommended Setup Upgrades
                        </h3>

                        <button
                          type="button"
                          onClick={() => setShowUpgradeDetails((prev) => !prev)}
                          className="rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72] transition-all duration-200 hover:bg-cyan-100"
                        >
                          {showUpgradeDetails
                            ? 'Hide details'
                            : 'Expand details'}
                        </button>
                      </div>

                      <p className="mb-6 text-sm leading-relaxed text-gray-600">
                        These upgrades are filtered to fit after{' '}
                        <span className="font-semibold text-[#132a72]">
                          {recommendedBoatName ?? 'your recommended boat'}
                        </span>{' '}
                        within your total project budget. Remaining upgrade
                        allowance: {remainingUpgradeBudgetLabel}.
                      </p>

                      {recommendedUpgrades.length > 0 ? (
                        <div className="space-y-6">
                          {groupedUpgrades.map(([category, items]) => (
                            <div key={category}>
                              <div className="mb-3 flex items-center gap-3">
                                <h4 className="text-xl font-bold text-[#132a72]">
                                  {category} Options
                                </h4>
                                {items.length > 1 && (
                                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                    Best fit first
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {items.map((item, index) => (
                                  <div
                                    key={item.id}
                                    className="rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5"
                                  >
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-cyan-600">
                                        {item.category}
                                      </p>
                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                          index === 0
                                            ? 'bg-cyan-100 text-cyan-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {index === 0 ? 'Best Fit' : 'Also Consider'}
                                      </span>
                                    </div>

                                    <h4 className="mb-2 text-xl font-bold text-[#132a72]">
                                      {item.title}
                                    </h4>

                                    <p className="mb-4 text-gray-600">
                                      {item.description}
                                    </p>

                                    {item.reasons.length > 0 && (
                                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                                          Why this was recommended
                                        </p>
                                        <ul className="space-y-1 text-sm text-cyan-900">
                                          {item.reasons.map((reason) => (
                                            <li
                                              key={reason}
                                              className="flex items-start gap-2"
                                            >
                                              <span className="mt-0.5">•</span>
                                              <span>{reason}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5 text-gray-600">
                          No setup upgrades fit comfortably after your
                          recommended boat within the remaining project budget.
                        </div>
                      )}

                      {requiredOutsideBudgetUpgrades.length > 0 && (
                        <div className="mt-6 rounded-[20px] border border-amber-200 bg-amber-50 p-5">
                          <div className="mb-4">
                            <h4 className="text-lg font-bold text-amber-900">
                              Required but likely outside your current budget
                            </h4>
                            <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                              You marked these items as required, so we are
                              still surfacing them even though they likely need
                              to be budgeted separately from the recommended
                              boat-first setup.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {requiredOutsideBudgetUpgrades.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-[20px] border border-amber-200 bg-white p-5"
                              >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-amber-700">
                                    {item.category}
                                  </p>
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                    Required
                                  </span>
                                </div>

                                <h4 className="mb-2 text-xl font-bold text-[#132a72]">
                                  {item.title}
                                </h4>

                                <p className="mb-4 text-gray-600">
                                  {item.description}
                                </p>

                                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                                    Why this is still surfaced
                                  </p>
                                  <ul className="space-y-1 text-sm text-amber-900">
                                    {item.reasons.map((reason) => (
                                      <li
                                        key={reason}
                                        className="flex items-start gap-2"
                                      >
                                        <span className="mt-0.5">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {showUpgradeDetails && (
                        <div className="mt-6 rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <h4 className="mb-3 text-lg font-bold text-[#132a72]">
                            Why these upgrades matter
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>
                              • Helps protect your boat and dock investment
                            </li>
                            <li>
                              • Improves comfort and day-to-day usability on the
                              lake
                            </li>
                            <li>
                              • Reflects your remaining setup budget,
                              priorities, and dock setup
                            </li>
                            <li>
                              • Creates a more complete setup instead of just a
                              boat purchase
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[28px] bg-[#132a72] p-8 text-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-200">
                          Next step
                        </p>
                        <h3 className="text-2xl font-bold">
                          Want this setup sent to you?
                        </h3>
                        <p className="mt-2 max-w-2xl text-white/85">
                          Save your recommendation, revisit it later, or use it
                          when you start talking with dealers.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowLeadForm(true);
                          setLeadSuccess(false);
                          setLeadError('');
                        }}
                        className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg active:scale-[0.98]"
                      >
                        Email My Results
                      </button>
                    </div>
                  </section>
                </div>
              ) : (
                <section className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                  <h2 className="mb-3 text-2xl font-bold text-[#132a72]">
                    {selectedUsage === 'Fishing'
                      ? 'Fishing inventory is still expanding'
                      : 'No exact matches found'}
                  </h2>
                  <p className="text-gray-600">
                    {selectedUsage === 'Fishing'
                      ? 'We do not have enough fishing-specific boat inventory in LakeLifeIQ yet to return a confident recommendation for that category.'
                      : 'Try adjusting your usage, budget, or dock type to broaden the recommendation range.'}
                  </p>
                  {selectedUsage === 'Fishing' && (
                    <p className="mt-3 text-gray-600">
                      Fishing coverage is being expanded, so for now this
                      result is intentionally withheld instead of showing a wake
                      or surf boat that is not explicitly tagged for fishing.
                    </p>
                  )}
                  {selectedUsage === 'Fishing' && (
                    <p className="mt-3 text-gray-600">
                      You can try another primary usage for now, or check back
                      once fishing inventory has been added.
                    </p>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Save Your Results
                </p>
                <h3 className="text-2xl font-bold text-[#132a72]">
                  Email this setup to yourself
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  We’ll send your recommendation and save your lead for
                  follow-up.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLeadForm(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            {leadSuccess ? (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-800">
                Your results were sent successfully.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleLeadSubmit}>
                {leadError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {leadError}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Name
                  </label>
                  <input
                    type="text"
                    value={leadForm.name}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Email
                  </label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Notes
                  </label>
                  <textarea
                    value={leadForm.notes}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="w-full rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                >
                  {isSubmittingLead ? 'Sending...' : 'Send My Results'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
