import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

export const Users = sqliteTable("Users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  birth_date: text("birth_date"),
  gender: text("gender"),
  role: text("role", { enum: ["client", "agent", "admin"] }).default("client"),
  status: text("status", { enum: ["active", "inactive"] }).default("active"),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
  udate: text("udate"),
});

export const Addresses = sqliteTable("Addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => Users.id),
  title: text("title"),
  fullname: text("fullname").notNull(),
  surname: text("surname").notNull(),
  tel: text("tel").notNull(),
  address_line: text("address_line").notNull(),
  subdistrict_id: integer("subdistrict_id").notNull().references(() => Subdistricts.id),
  tag: text("tag"),
});

export const Brands = sqliteTable("Brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
  status: text("status", { enum: ["active", "inactive"] }).default("active"),
});

export const Countries = sqliteTable("Countries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
});

export const Provinces = sqliteTable("Provinces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  country_id: integer("country_id").notNull().references(() => Countries.id),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
});

export const Districts = sqliteTable("Districts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  province_id: integer("province_id").notNull().references(() => Provinces.id),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
});

export const Subdistricts = sqliteTable("Subdistricts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  district_id: integer("district_id").notNull().references(() => Districts.id),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
  postal_code: text("postal_code").notNull(),
});

export const Ships = sqliteTable("Ships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  ship_date: text("ship_date").notNull(),
  track_no: text("track_no"),
  ship_price: real("ship_price"),
  courier_name: text("courier_name"),
  origin_id: integer("origin_id").notNull().references(() => Countries.id),
  destination_id: integer("destination_id").notNull().references(() => Countries.id),
  max_cap: real("max_cap").default(0),
  current_cap: real("current_cap").default(0),
  close_date: text("close_date"),
  status: text("status", { enum: ["open", "closed", "in_transit", "arrived"] }).default('open'),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
  udate: text("udate"),
});

export const Categories = sqliteTable("Categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
});

export const Products = sqliteTable("Products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category_id: integer("category_id").references(() => Categories.id),
  name_en: text("name_en").notNull(),
  name_th: text("name_th"),
  name_jp: text("name_jp"),
  desc_en: text("desc_en"),
  desc_th: text("desc_th"),
  desc_jp: text("desc_jp"),
  brand_id: integer("brand_id").references(() => Brands.id),
  origin_country_id: integer("origin_country_id").references(() => Countries.id),
  price_tentative_jpy: real("price_tentative_jpy"),
  price_tentative_thb: real("price_tentative_thb"),
  img: text("img", { mode: 'json' }).$type<string[]>(),
  tag: text("tag"),
  amount: integer("amount").default(0),
  weight: real("weight").default(0),
  remain: integer("remain").default(0),
  status: text("status", { enum: ["active", "inactive", "out_of_stock"] }),
  total_sold: integer("total_sold").default(0),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
  udate: text("udate"),
});

export const Orders = sqliteTable("Orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  order_code: text("order_code").unique(),
  user_id: integer("user_id").notNull().references(() => Users.id),
  trip_id: integer("trip_id").notNull().references(() => Ships.id),
  address_id: integer("address_id").notNull().references(() => Addresses.id),
  deliv_date: text("deliv_date"),
  track_no: text("track_no"),
  courier_name: text("courier_name"),
  item_price_total: real("item_price_total"),
  shipping_fee_jp_th: real("shipping_fee_jp_th"),
  shipping_fee_th_th: real("shipping_fee_th_th"),
  grand_total: real("grand_total"),
  payment_status: text("payment_status", { enum: ["pending_deposit", "deposit_paid", "pending_remaining", "fully_paid"] }),
  status: text("status", { enum: ["pending", "purchasing", "arrived_th", "shipped", "delivered", "cancelled"] }),
  sender_id: integer("sender_id").references(() => Users.id),
  shipped_date: text("shipped_date"),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
  udate: text("udate"),
});

export const Order_Items = sqliteTable("Order_Items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  order_id: integer("order_id").references(() => Orders.id),
  ticket_id: integer("ticket_id").references(() => Tickets.id),
  product_id: integer("product_id").references(() => Products.id),
  final_price: real("final_price"),
  quantity: integer("quantity"),
  missing: integer("missing"),
  udate: text("udate"),
});

export const Purchases = sqliteTable("Purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  order_item_id: integer("order_item_id").references(() => Order_Items.id),
  product_id: integer("product_id").references(() => Products.id),
  agent_id: integer("agent_id").notNull().references(() => Users.id),
  quantity: integer("quantity").notNull(),
  actual_cost_jpy: real("actual_cost_jpy").notNull(),
  actual_cost_thb: real("actual_cost_thb").notNull(),
  shop_name: text("shop_name"),
  receipt_img: text("receipt_img", { mode: 'json' }).$type<string[]>(),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
});

export const Tickets = sqliteTable("Tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  client_id: integer("client_id").notNull().references(() => Users.id),
  agent_id: integer("agent_id").references(() => Users.id),
  trip_id: integer("trip_id").references(() => Ships.id),
  item_name: text("item_name").notNull(),
  brand: text("brand"),
  shop_name: text("shop_name"),
  area_name: text("area_name"),
  spec: text("spec"),
  img: text("img", { mode: "json" }).$type<string[]>().notNull(),
  external_link: text("external_link"),
  replacement: text("replacement"),
  expected_price: real("expected_price"),
  proposed_price_jpy: real("proposed_price_jpy"),
  proposed_price_thb: real("proposed_price_thb"),
  status: text("status", { enum: ["pending", "negotiating", "accepted", "rejected", "purchasing", "completed", "cancelled"] }),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
  udate: text("udate"),
});

export const Payments = sqliteTable("Payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  order_id: integer("order_id").references(() => Orders.id),
  ticket_id: integer("ticket_id").references(() => Tickets.id),
  amount: real("amount").notNull(),
  payment_type: text("payment_type", { enum: ["deposit", "remaining"] }).notNull(),
  method: text("method"),
  slip_img: text("slip_img").notNull(),
  status: text("status", { enum: ["pending", "verified", "failed"] }),
  verify_ref: text("verify_ref"),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
});

export const Areas = sqliteTable("Areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
  map_location: text("map_location"),
  status: text("status", { enum: ["active", "inactive"] }).default("active"),
});

export const Shops = sqliteTable("Shops", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  area_id: integer("area_id").notNull().references(() => Areas.id),
  name_th: text("name_th").notNull(),
  name_en: text("name_en").notNull(),
  name_jp: text("name_jp"),
  map_location: text("map_location"),
  status: text("status", { enum: ["active", "inactive"] }).default("active"),
});

export const Product_Locations = sqliteTable("Product_Locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),  // unused but best practice for API
  product_id: integer("product_id").notNull().references(() => Products.id),
  area_id: integer("area_id").notNull().references(() => Areas.id),
  shop_id: integer("shop_id").references(() => Shops.id),
});

export const Events = sqliteTable("Events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title_en: text("title_en").notNull(),
  title_th: text("title_th"),
  title_jp: text("title_jp"),
  desc_en: text("desc_en"),
  desc_th: text("desc_th"),
  desc_jp: text("desc_jp"),
  start_date: text("start_date").notNull(),
  end_date: text("end_date"),
  banner_img: text("banner_img"),
  trip_id: integer("trip_id").references(() => Ships.id),
  area_id: integer("area_id").references(() => Areas.id),
  shop_id: integer("shop_id").references(() => Shops.id),
});

export const Event_Products = sqliteTable("Event_Products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event_id: integer("event_id").notNull().references(() => Events.id),
  product_id: integer("product_id").notNull().references(() => Products.id),
});

export const Follows = sqliteTable("Follows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => Users.id),
  target_type: text("target_type").notNull(), // 'brand', 'product', 'event'
  target_brand: text("target_brand"),
  target_product: text("target_product"),
  target_event: text("target_event"),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
});

// Relations

export const usersRelations = relations(Users, ({ many }) => ({
  addresses: many(Addresses),
  orders: many(Orders, { relationName: "customer_orders" }),
  sentOrders: many(Orders, { relationName: "sender_orders" }),
  purchases: many(Purchases),
  ticketsAsClient: many(Tickets, { relationName: "client_tickets" }),
  ticketsAsAgent: many(Tickets, { relationName: "agent_tickets" }),
  follows: many(Follows),
}));

export const addressesRelations = relations(Addresses, ({ one, many }) => ({
  user: one(Users, { fields: [Addresses.user_id], references: [Users.id] }),
  subdistrict: one(Subdistricts, { fields: [Addresses.subdistrict_id], references: [Subdistricts.id] }),
  orders: many(Orders),
}));

export const countriesRelations = relations(Countries, ({ many }) => ({
  provinces: many(Provinces),
}));

export const provincesRelations = relations(Provinces, ({ one, many }) => ({
  country: one(Countries, { fields: [Provinces.country_id], references: [Countries.id] }),
  districts: many(Districts),
}));

export const districtsRelations = relations(Districts, ({ one, many }) => ({
  province: one(Provinces, { fields: [Districts.province_id], references: [Provinces.id] }),
  subdistricts: many(Subdistricts),
}));

export const subdistrictsRelations = relations(Subdistricts, ({ one, many }) => ({
  district: one(Districts, { fields: [Subdistricts.district_id], references: [Districts.id] }),
  addresses: many(Addresses),
}));

export const shipsRelations = relations(Ships, ({ one, many }) => ({
  origin: one(Countries, { fields: [Ships.origin_id], references: [Countries.id], relationName: "ship_origin" }),
  destination: one(Countries, { fields: [Ships.destination_id], references: [Countries.id], relationName: "ship_destination" }),
  orders: many(Orders),
  tickets: many(Tickets),
  events: many(Events),
}));

export const categoriesRelations = relations(Categories, ({ many }) => ({
  products: many(Products),
}));

export const productsRelations = relations(Products, ({ one, many }) => ({
  category: one(Categories, { fields: [Products.category_id], references: [Categories.id] }),
  origin_country: one(Countries, {
    fields: [Products.origin_country_id],
    references: [Countries.id],
  }),
  brand: one(Brands, {
    fields: [Products.brand_id],
    references: [Brands.id],
  }),
  orderItems: many(Order_Items),
  locations: many(Product_Locations),
  eventProducts: many(Event_Products),
}));

export const ordersRelations = relations(Orders, ({ one, many }) => ({
  user: one(Users, { fields: [Orders.user_id], references: [Users.id], relationName: "customer_orders" }),
  sender: one(Users, { fields: [Orders.sender_id], references: [Users.id], relationName: "sender_orders" }),
  ship: one(Ships, { fields: [Orders.trip_id], references: [Ships.id] }),
  address: one(Addresses, { fields: [Orders.address_id], references: [Addresses.id] }),
  items: many(Order_Items),
  payments: many(Payments),
}));

export const orderItemsRelations = relations(Order_Items, ({ one, many }) => ({
  order: one(Orders, { fields: [Order_Items.order_id], references: [Orders.id] }),
  product: one(Products, { fields: [Order_Items.product_id], references: [Products.id] }),
  ticket: one(Tickets, { fields: [Order_Items.ticket_id], references: [Tickets.id] }),
  purchases: many(Purchases),
}));

export const purchasesRelations = relations(Purchases, ({ one }) => ({
  orderItem: one(Order_Items, { fields: [Purchases.order_item_id], references: [Order_Items.id] }),
  agent: one(Users, { fields: [Purchases.agent_id], references: [Users.id] }),
}));

export const ticketsRelations = relations(Tickets, ({ one, many }) => ({
  client: one(Users, { fields: [Tickets.client_id], references: [Users.id], relationName: "client_tickets" }),
  agent: one(Users, { fields: [Tickets.agent_id], references: [Users.id], relationName: "agent_tickets" }),
  ship: one(Ships, { fields: [Tickets.trip_id], references: [Ships.id] }),
  orderItems: many(Order_Items),
  payments: many(Payments),
}));

export const paymentsRelations = relations(Payments, ({ one }) => ({
  order: one(Orders, { fields: [Payments.order_id], references: [Orders.id] }),
  ticket: one(Tickets, { fields: [Payments.ticket_id], references: [Tickets.id] }),
}));

export const areasRelations = relations(Areas, ({ many }) => ({
  shops: many(Shops),
  productLocations: many(Product_Locations),
  events: many(Events),
}));

export const shopsRelations = relations(Shops, ({ one, many }) => ({
  area: one(Areas, { fields: [Shops.area_id], references: [Areas.id] }),
  productLocations: many(Product_Locations),
  events: many(Events),
}));

export const productLocationsRelations = relations(Product_Locations, ({ one }) => ({
  product: one(Products, { fields: [Product_Locations.product_id], references: [Products.id] }),
  area: one(Areas, { fields: [Product_Locations.area_id], references: [Areas.id] }),
  shop: one(Shops, { fields: [Product_Locations.shop_id], references: [Shops.id] }),
}));

export const eventsRelations = relations(Events, ({ one, many }) => ({
  ship: one(Ships, { fields: [Events.trip_id], references: [Ships.id] }),
  area: one(Areas, { fields: [Events.area_id], references: [Areas.id] }),
  shop: one(Shops, { fields: [Events.shop_id], references: [Shops.id] }),
  eventProducts: many(Event_Products),
}));

export const eventProductsRelations = relations(Event_Products, ({ one }) => ({
  event: one(Events, { fields: [Event_Products.event_id], references: [Events.id] }),
  product: one(Products, { fields: [Event_Products.product_id], references: [Products.id] }),
}));

export const followsRelations = relations(Follows, ({ one }) => ({
  user: one(Users, { fields: [Follows.user_id], references: [Users.id] }),
}));

export const Product_Name_History = sqliteTable("Product_Name_History", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  product_id: integer("product_id").notNull().references(() => Products.id),
  old_name: text("old_name").notNull(),
  new_name: text("new_name").notNull(),
  cdate: text("cdate").default(sql`CURRENT_TIMESTAMP`),
});
