import prisma from "../config/database.js";

export const getAllMeters = async ({ page = 1, limit = 10, search = "", status = "" }) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.OR = [
      { meterNumber: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const [meters, total] = await Promise.all([
    prisma.waterMeter.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.waterMeter.count({ where }),
  ]);

  return {
    meters,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getMeterById = async (id) => {
  const meter = await prisma.waterMeter.findUnique({
    where: { id },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });

  if (!meter) {
    const error = new Error("Water meter not found");
    error.statusCode = 404;
    throw error;
  }

  return meter;
};

export const createMeter = async ({ meterNumber, location, status, installedAt, userId }) => {
  const existing = await prisma.waterMeter.findUnique({ where: { meterNumber } });
  if (existing) {
    const error = new Error("Meter number already exists");
    error.statusCode = 409;
    throw error;
  }

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.waterMeter.create({
    data: {
      meterNumber,
      location,
      status: status || "ACTIVE",
      installedAt: installedAt ? new Date(installedAt) : null,
      userId,
    },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
};

export const updateMeter = async (id, { meterNumber, location, status, installedAt, userId }) => {
  const existing = await prisma.waterMeter.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("Water meter not found");
    error.statusCode = 404;
    throw error;
  }

  if (meterNumber && meterNumber !== existing.meterNumber) {
    const dup = await prisma.waterMeter.findUnique({ where: { meterNumber } });
    if (dup) {
      const error = new Error("Meter number already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  const data = {};
  if (meterNumber !== undefined) data.meterNumber = meterNumber;
  if (location !== undefined) data.location = location;
  if (status !== undefined) data.status = status;
  if (installedAt !== undefined) data.installedAt = installedAt ? new Date(installedAt) : null;
  if (userId !== undefined) data.userId = userId;

  return prisma.waterMeter.update({
    where: { id },
    data,
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
};

export const deleteMeter = async (id) => {
  const existing = await prisma.waterMeter.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("Water meter not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.waterMeter.delete({ where: { id } });
};

export const getMetersByUser = async (userId) => {
  return prisma.waterMeter.findMany({
    where: { userId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
};
