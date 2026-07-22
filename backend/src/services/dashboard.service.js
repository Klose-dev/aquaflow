import prisma from "../config/database.js";

export const getStats = async () => {
  const [totalMeters, activeMeters, totalUsers, totalReadings, unreadNotifications] =
    await Promise.all([
      prisma.waterMeter.count(),
      prisma.waterMeter.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.waterReading.count(),
      prisma.notification.count({ where: { status: "UNREAD" } }),
    ]);

  return {
    totalMeters,
    activeMeters,
    totalUsers,
    totalReadings,
    unreadNotifications,
  };
};

export const getRecentReadings = async ({ limit = 5 } = {}) => {
  return prisma.waterReading.findMany({
    take: limit,
    orderBy: { recordedAt: "desc" },
    include: {
      meter: { select: { id: true, meterNumber: true, location: true } },
    },
  });
};

export const getUsageTrend = async ({ days = 30 } = {}) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const readings = await prisma.waterReading.findMany({
    where: { recordedAt: { gte: startDate } },
    orderBy: { recordedAt: "asc" },
    select: { value: true, recordedAt: true },
  });

  const grouped = {};
  for (const r of readings) {
    const date = r.recordedAt.toISOString().split("T")[0];
    if (!grouped[date]) grouped[date] = { date, totalVolume: 0, count: 0 };
    grouped[date].totalVolume += Number(r.value);
    grouped[date].count += 1;
  }

  return Object.values(grouped);
};
