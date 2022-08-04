import { Op } from 'sequelize';
import Tag from '../../Tags/schema';

export function getOrderByfield(search: any, sortOrder: any) {
    let orderBy, sortField;
    let condition: any = [];
    let tagCondition: any = [];

    if (search) {
        let filter = search.filter;
        for (let key in filter) {
            const data: any = filter[key];
            // console.log(data);

            switch (key) {
                case 'title':
                    orderBy = [['title', sortOrder]];
                    sortField = 'title';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'description':
                    orderBy = [['description', sortOrder]];
                    sortField = 'description';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'is_published':
                    orderBy = [['is_published', sortOrder]];
                    sortField = 'is_published';
                    condition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
                case 'tag':
                    orderBy = [[{ model: Tag, as: 'tags' }, 'tag', sortOrder]];
                    sortField = 'tag';
                    tagCondition.push({
                        [key]: { [Op.like]: `%${data}%` },
                    });
                    break;
            }
        }
    } else {
        orderBy = [['created_at', sortOrder]];
        sortField = 'created_at';
    }
    return { orderBy, sortField, condition, tagCondition };
}
