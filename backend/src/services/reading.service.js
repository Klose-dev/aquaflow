import prisma from "../config/database.js";

export const getAllReadings = async ({ page = 1, limit = 10, meterId = "" }) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (meterId) {
    where.meterId = meterId;
  }

  const [readings, total] = await Promise.all([
    prisma.waterReading.findMany({
      where,
      include: {
        meter: { select: { id: true, meterNumber: true, location: true } },
      },
      skip,
      take: limit,
      orderBy: { recordedAt: "desc" },
    }),
    prisma.waterReading.count({ where }),
  ]);

  return {
    readings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getReadingsByMeter = async (meterId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const where = { meterId };

  const [readings, total] = await Promise.all([
    prisma.waterReading.findMany({
      where,
      include: {
        meter: { select: { id: true, meterNumber: true, location: true } },
      },
      skip,
      take: limit,
      orderBy: { recordedAt: "desc" },
    }),
    prisma.waterReading.count({ where }),
  ]);

  return {
    readings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const createReading = async ({ meterId, value, recordedAt }) => {
  const meter = await prisma.waterMeter.findUnique({ where: { id: meterId } });
  if (!meter) {
    const error = new Error("Water meter not found");
    error.statusCode = 404;
    throw error;
  }

  const recordDate = new Date(recordedAt);

  const existing = await prisma.waterReading.findUnique({
    where: { meterId_recordedAt: { meterId, recordedAt: recordDate } },
  });
  if (existing) {
    const error = new Error("A reading already exists for this meter at this time");
    error.statusCode = 409;
    throw error;
  }

  return prisma.waterReading.create({
    data: {
      meterId,
      value,
      recordedAt: recordDate,
    },
    include: {
      meter: { select: { id: true, meterNumber: true, location: true } },
    },
  });
};

export const getMeterStats = async (meterId, { startDate, endDate } = {}) => {
  const meter = await prisma.waterMeter.findUnique({ where: { id: meterId } });
  if (!meter) {
    const error = new Error("Water meter not found");
    error.statusCode = 404;
    throw error;
  }

  const where = { meterId };
  if (startDate || endDate) {
    where.recordedAt = {};
    if (startDate) where.recordedAt.gte = new Date(startDate);
    if (endDate) where.recordedAt.lte = new Date(endDate);
  }

  const readings = await prisma.waterReading.findMany({
    where,
    orderBy: { recordedAt: "asc" },
  });

  if (readings.length === 0) {
    return {
      meterId,
      totalReadings: 0,
      totalVolume: 0,
      averageVolume: 0,
      minVolume: 0,
      maxVolume: 0,
      firstReading: null,
      lastReading: null,
    };
  }

  const values = readings.map((r) => Number(r.value));
  const totalVolume = values.reduce((sum, v) => sum + v, 0);

  return {
    meterId,
    totalReadings: readings.length,
    totalVolume,
    averageVolume: totalVolume / readings.length,
    minVolume: Math.min(...values),
    maxVolume: Math.max(...values),
    firstReading: readings[0],
    lastReading: readings[readings.length - 1],
  };
};
