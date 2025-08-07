import { Router, Request, Response } from "express";
import { companies } from "../data/mockData.js";

const router = Router();

router.get("/overview", (req: Request, res: Response) => {
  try {
    const totalCompanies = companies.length;

    let totalTeams = 0;
    let totalMembers = 0;
    let totalActivities = 0;
    let totalHours = 0;
    const activityTypeHours: { [key: string]: number } = {};

    companies.forEach((company) => {
      totalTeams += company.teams.length;

      company.teams.forEach((team) => {
        totalMembers += team.members.length;

        team.members.forEach((member) => {
          member.activities.forEach((activity) => {
            totalActivities++;
            totalHours += activity.hours;

            if (activityTypeHours[activity.type]) {
              activityTypeHours[activity.type] += activity.hours;
            } else {
              activityTypeHours[activity.type] = activity.hours;
            }
          });
        });
      });
    });

    const topActivityTypes = Object.entries(activityTypeHours)
      .map(([type, totalHours]) => ({ type, totalHours }))
      .sort((a, b) => b.totalHours - a.totalHours);

    const response = {
      totalCompanies,
      totalTeams,
      totalMembers,
      totalActivities,
      totalHours,
      topActivityTypes,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /report/overview:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/company/:companyId", (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const company = companies.find((c) => c.companyId === companyId);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    const teams = company.teams.map((team) => {
      const totalMembers = team.members.length;
      let totalHours = 0;
      const activityTypeHours: { [key: string]: number } = {};
      const uniqueTagsSet = new Set<string>();

      team.members.forEach((member) => {
        member.activities.forEach((activity) => {
          totalHours += activity.hours;

          if (activityTypeHours[activity.type]) {
            activityTypeHours[activity.type] += activity.hours;
          } else {
            activityTypeHours[activity.type] = activity.hours;
          }

          activity.tags.forEach((tag) => uniqueTagsSet.add(tag));
        });
      });

      const activityBreakdown = Object.entries(activityTypeHours)
        .map(([type, totalHours]) => ({ type, totalHours }))
        .sort((a, b) => b.totalHours - a.totalHours);

      const uniqueTags = Array.from(uniqueTagsSet).sort();

      return {
        teamId: team.teamId,
        teamName: team.name,
        totalMembers,
        totalHours,
        activityBreakdown,
        uniqueTags,
      };
    });

    const response = {
      companyId: company.companyId,
      companyName: company.name,
      teams,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /report/company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
