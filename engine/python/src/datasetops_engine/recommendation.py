def build_recommendations(report: dict) -> list[dict]:
    recs = []
    total = report["dataset"]["totalImages"]

    if report["dataset"].get("warnings"):
        for warning in report["dataset"]["warnings"]:
            recs.append(
                {
                    "severity": "medium",
                    "problem": "Large dataset scan may take time.",
                    "evidence": warning,
                    "action": "Run a fast or sampled scan first, then schedule the full Python audit when the machine is idle.",
                }
            )

    if report["leakage"]["leakedGroups"]:
        recs.append(
            {
                "severity": "high",
                "problem": "Exact duplicate images appear across train/validation/test splits.",
                "evidence": f"{report['leakage']['leakedGroups']} hash group(s) cross split boundaries.",
                "action": "Remove or move leaked duplicates before trusting validation or test scores.",
            }
        )

    if report["imbalance"]["isImbalanced"]:
        recs.append(
            {
                "severity": "medium",
                "problem": "Class distribution is imbalanced.",
                "evidence": (
                    f"{report['imbalance']['minorityClass']} is "
                    f"{report['imbalance']['minorityClassShare']:.1%} of the dataset; "
                    f"majority/minority ratio is {report['imbalance']['majorityToMinorityRatio']}x."
                ),
                "action": "Use class weights, a sampler, or collect more minority-class examples before comparing models.",
            }
        )

    if total and report["quality"]["lowResolutionImages"] / total >= 0.1:
        recs.append(
            {
                "severity": "medium",
                "problem": "Many images are below the minimum resolution threshold.",
                "evidence": f"{report['quality']['lowResolutionImages']} of {total} images are under 256px on one side.",
                "action": "Try a smaller training image size such as 320/384, or replace low-detail samples.",
            }
        )

    if total and report["quality"]["blurredImages"] / total >= 0.1:
        recs.append(
            {
                "severity": "medium",
                "problem": "Blur risk may hide object detail.",
                "evidence": f"{report['quality']['blurredImages']} of {total} images are below the blur threshold.",
                "action": "Inspect blurred samples and remove images where the target object is not visually recoverable.",
            }
        )

    if report["duplicates"]["exactDuplicateGroups"]:
        recs.append(
            {
                "severity": "low",
                "problem": "Exact duplicate files reduce dataset diversity.",
                "evidence": f"{report['duplicates']['exactDuplicateGroups']} duplicate hash group(s) were found.",
                "action": "Keep one representative from each duplicate group unless duplicates are intentional.",
            }
        )

    confusion = report.get("confusion")
    if confusion and confusion.get("topPairs"):
        top = confusion["topPairs"][0]
        recs.append(
            {
                "severity": "low",
                "problem": "One label pair dominates model errors.",
                "evidence": f"{top['actual']} -> {top['predicted']} appears {top['count']} time(s).",
                "action": "Review examples from this pair and check whether labels or visual criteria are ambiguous.",
            }
        )

    if not recs:
        recs.append(
            {
                "severity": "low",
                "problem": "No high-risk readiness issue crossed the default thresholds.",
                "evidence": "Folder structure, quality metrics, duplicates, leakage, and class balance stayed within v1 thresholds.",
                "action": "Proceed with normal training hygiene and keep a held-out test set untouched.",
            }
        )

    return recs
