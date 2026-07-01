import SyntheticEventImpl from '@client/events/synthetic-event-impl';
import INavNode from '@models/nav';
interface NavigationEventDetail {
    location: INavNode;
}
export default class NavigationEvent<E extends HTMLElement = HTMLElement> extends SyntheticEventImpl<E> {
    detail: NavigationEventDetail;
    constructor(init: CustomEventInit, target?: E | null) {
        super('navigate', init, target);
        this.detail = init.detail as NavigationEventDetail;
    }
}
