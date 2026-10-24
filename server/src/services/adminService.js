import prisma from "../config/db.js";

export const getAdminProperties = async (filters = {}) => {
  const { status, page = 1, limit = 10 } = filters;

  const where = {};
  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status.toUpperCase())) {
    where.status = status.toUpperCase();
  }

  const take = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * take;

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        images: {
          where: { isCover: true },
          take: 1,
        },
        _count: {
          select: { bookings: true, reviews: true },
        },
      },
    }),
  ]);

  return {
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / take),
    properties,
  };
};

export const updatePropertyModeration = async (adminId, propertyId, updateData) => {
  const { status, rejectionReason } = updateData;

  if (!status || !["APPROVED", "REJECTED"].includes(status)) {
    throw new Error("Status must be either 'APPROVED' or 'REJECTED'");
  }

  if (status === "REJECTED" && (!rejectionReason || !rejectionReason.trim())) {
    throw new Error("A rejection reason is required when rejecting a property");
  }

  const existingProperty = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!existingProperty) {
    throw new Error("Property not found");
  }

  const updatedProperty = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason.trim() : null,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
    include: {
      host: {
        select: { id: true, name: true, email: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updatedProperty;
};

export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalHosts,
    totalProperties,
    pendingProperties,
    totalBookings,
    confirmedBookings,
    payments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "HOST" } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.findMany({
      where: { status: "PAID" },
      select: { amount: true },
    }),
  ]);

  const totalRevenue = payments.reduce(
    (acc, curr) => acc + parseFloat(curr.amount),
    0
  );

  return {
    users: {
      total: totalUsers,
      hosts: totalHosts,
      customers: totalUsers - totalHosts,
    },
    properties: {
      total: totalProperties,
      pending: pendingProperties,
      approved: totalProperties - pendingProperties,
    },
    bookings: {
      total: totalBookings,
      confirmed: confirmedBookings,
    },
    financials: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      completedTransactions: payments.length,
    },
  };
};