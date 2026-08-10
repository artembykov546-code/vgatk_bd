// ============================================================
// УПРАВЛЕНИЕ ГРУППАМИ
// ============================================================

class GroupsManager {
    constructor() {
        this.groups = this.loadGroups();
        this.graduates = this.loadGraduates();
    }

    // Загрузка групп из localStorage
    loadGroups() {
        const data = localStorage.getItem('groups');
        return data ? JSON.parse(data) : [];
    }

    // Загрузка выпускников из localStorage
    loadGraduates() {
        const data = localStorage.getItem('graduates');
        return data ? JSON.parse(data) : [];
    }

    // Сохранение групп
    saveGroups() {
        localStorage.setItem('groups', JSON.stringify(this.groups));
    }

    // Сохранение выпускников
    saveGraduates() {
        localStorage.setItem('graduates', JSON.stringify(this.graduates));
    }

    // Создание группы
    createGroup(groupData) {
        const group = {
            id: Date.now().toString(),
            name: groupData.name,
            type: groupData.type, // 'ССО' или 'ПТО'
            startDate: groupData.startDate,
            endDate: groupData.endDate,
            course: groupData.course || 1,
            students: [],
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        this.groups.push(group);
        this.saveGroups();
        return group;
    }

    // Получение группы по ID
    getGroup(groupId) {
        return this.groups.find(g => g.id === groupId);
    }

    // Обновление группы
    updateGroup(groupId, updates) {
        const group = this.getGroup(groupId);
        if (group) {
            Object.assign(group, updates);
            this.saveGroups();
            return group;
        }
        return null;
    }

    // Удаление группы
    deleteGroup(groupId) {
        const index = this.groups.findIndex(g => g.id === groupId);
        if (index !== -1) {
            this.groups.splice(index, 1);
            this.saveGroups();
            return true;
        }
        return false;
    }

    // Выпуск группы (перемещение в выпускники)
    graduateGroup(groupId) {
        const group = this.getGroup(groupId);
        if (!group) {
            alert('❌ Группа не найдена');
            return false;
        }

        // Создаем запись о выпуске
        const graduateRecord = {
            id: Date.now().toString(),
            groupId: group.id,
            name: group.name,
            type: group.type,
            startDate: group.startDate,
            endDate: group.endDate,
            course: group.course,
            students: [...group.students],
            graduatedAt: new Date().toISOString(),
            graduationYear: new Date().getFullYear()
        };

        // Добавляем в выпускники
        this.graduates.push(graduateRecord);
        this.saveGraduates();

        // Удаляем из активных групп
        this.deleteGroup(groupId);

        alert(`✅ Группа "${group.name}" выпущена!`);
        return true;
    }

    // Получение всех выпускников
    getGraduates() {
        return this.graduates;
    }

    // Получение выпускника по ID
    getGraduate(graduateId) {
        return this.graduates.find(g => g.id === graduateId);
    }

    // Фильтрация групп по типу и курсу
    filterGroups(filters = {}) {
        return this.groups.filter(group => {
            if (filters.type && group.type !== filters.type) return false;
            if (filters.course && group.course !== parseInt(filters.course)) return false;
            if (filters.status && group.status !== filters.status) return false;
            return true;
        });
    }
}

// Экспортируем экземпляр
window.groupsManager = new GroupsManager();