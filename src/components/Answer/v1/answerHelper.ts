import { Op } from 'sequelize';

export function getOrderByfield(search: any, sortOrder: any) {
    let orderBy, sortField;
    const condition: any = [];

    if (search) {
        const filter = search.filter;
        for (const key in filter) {
            const data: any = filter[key];
            // console.log(data);

            switch (key) {
                case 'answer':
                    orderBy = [['answer', sortOrder]];
                    sortField = 'answer';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'is_accepted':
                    orderBy = [['is_accepted', sortOrder]];
                    sortField = 'is_accepted';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
            }
        }
    } else {
        orderBy = [['created_at', sortOrder]];
        sortField = 'created_at';
    }
    return { orderBy, sortField, condition };
}
