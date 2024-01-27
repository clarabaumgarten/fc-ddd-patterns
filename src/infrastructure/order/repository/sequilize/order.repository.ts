import { where } from "sequelize";
import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderItem from "../../../../domain/checkout/entity/order_item";

export default class OrderRepository {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        total: entity.total(),
        customer_id: entity.customerId
      },
      {
        where: {
          id: entity.id,
        },
      },
    );

    const orders = await this.findAll();
    const itemsToSave = entity.items.filter(item => {
      return !orders.filter(order => order.items.includes(item));
    });


    await OrderItemModel.create(
      {
        id: itemsToSave[0].id,
        name: itemsToSave[0].name,
        price: itemsToSave[0].price,
        product_id: itemsToSave[0].productId,
        quantity: itemsToSave[0].quantity,
        order_id: entity.id
    });

  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne({ where: { id } });
    const orderItems = await OrderItemModel.findAll();

    const itemsFilter = orderItems.filter(item => item.order_id === id);

    const items = itemsFilter.map((item) => 
    new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity));

    return new Order(orderModel.id, orderModel.customer_id, items);
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll();
    const orderItems = await OrderItemModel.findAll();

    return orderModels.map((orderModel) =>
      new Order(orderModel.id, orderModel.customer_id,
        orderItems.map((item) => {
          if (item.order_id === orderModel.id) {
            return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity)
          }
        }
        )
      )
    );
  }
}
