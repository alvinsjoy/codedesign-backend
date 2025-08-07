import { Router, Request, Response } from "express";
import { companies } from "../data/mockData.js";
import {
  filterActivitiesByDateRange,
  isValidDateFormat,
} from "../utils/dateUtils.js";

const router = Router();

router.get("/overview", (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (
      startDate &&
      typeof startDate === "string" &&
      !isValidDateFormat(startDate)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid startDate format. Use YYYY-MM-DD" });
    }

    if (endDate && typeof endDate === "string" && !isValidDateFormat(endDate)) {
      return res
        .status(400)
        .json({ error: "Invalid endDate format. Use YYYY-MM-DD" });
    }

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
          const filteredActivities = filterActivitiesByDateRange(
            member.activities,
            startDate as string,
            endDate as string
          );

          filteredActivities.forEach((activity) => {
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
      ...(startDate || endDate
        ? {
            dateFilter: {
              startDate: startDate || "N/A",
              endDate: endDate || "N/A",
            },
          }
        : {}),
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
    const { startDate, endDate } = req.query;

    if (
      startDate &&
      typeof startDate === "string" &&
      !isValidDateFormat(startDate)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid startDate format. Use YYYY-MM-DD" });
    }

    if (endDate && typeof endDate === "string" && !isValidDateFormat(endDate)) {
      return res
        .status(400)
        .json({ error: "Invalid endDate format. Use YYYY-MM-DD" });
    }

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
        const filteredActivities = filterActivitiesByDateRange(
          member.activities,
          startDate as string,
          endDate as string
        );

        filteredActivities.forEach((activity) => {
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
      ...(startDate || endDate
        ? {
            dateFilter: {
              startDate: startDate || "N/A",
              endDate: endDate || "N/A",
            },
          }
        : {}),
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /report/company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/member/:memberId", (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;

    if (
      startDate &&
      typeof startDate === "string" &&
      !isValidDateFormat(startDate)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid startDate format. Use YYYY-MM-DD" });
    }

    if (endDate && typeof endDate === "string" && !isValidDateFormat(endDate)) {
      return res
        .status(400)
        .json({ error: "Invalid endDate format. Use YYYY-MM-DD" });
    }

    let foundMember = null;
    let memberName = "";

    for (const company of companies) {
      for (const team of company.teams) {
        const member = team.members.find((m) => m.memberId === memberId);
        if (member) {
          foundMember = member;
          memberName = member.name;
          break;
        }
      }
      if (foundMember) break;
    }

    if (!foundMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    const filteredActivities = filterActivitiesByDateRange(
      foundMember.activities,
      startDate as string,
      endDate as string
    );

    const totalHours = filteredActivities.reduce(
      (sum, activity) => sum + activity.hours,
      0
    );

    const dailyActivitiesMap: {
      [date: string]: { activities: string[]; hours: number };
    } = {};

    filteredActivities.forEach((activity) => {
      if (!dailyActivitiesMap[activity.date]) {
        dailyActivitiesMap[activity.date] = { activities: [], hours: 0 };
      }

      dailyActivitiesMap[activity.date].activities.push(activity.type);
      dailyActivitiesMap[activity.date].hours += activity.hours;
    });

    const dailyBreakdown = Object.entries(dailyActivitiesMap)
      .map(([date, { activities, hours }]) => ({
        date,
        activities,
        hours,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const response = {
      memberId: foundMember.memberId,
      name: memberName,
      totalHours,
      dailyBreakdown,
      ...(startDate || endDate
        ? {
            dateFilter: {
              startDate: startDate || "N/A",
              endDate: endDate || "N/A",
            },
          }
        : {}),
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /report/member:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
