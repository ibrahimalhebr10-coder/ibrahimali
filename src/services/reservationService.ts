import { supabase } from '../lib/supabase';

export interface CartItem {
  varietyName: string;
  typeName: string;
  quantity: number;
  price: number;
}

export interface CreateReservationData {
  farmId: number | string;
  farmName: string;
  cart: Record<string, CartItem>;
  totalTrees: number;
  totalPrice: number;
  contractId?: string;
  contractName?: string;
  durationYears?: number;
  bonusYears?: number;
  treeDetails?: any[];
}

export interface Reservation {
  id: string;
  userId: string | null;
  farmId: number | string;
  farmName: string;
  totalTrees: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  contractId?: string;
  contractName?: string;
  durationYears?: number;
  bonusYears?: number;
  treeDetails?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservationItem {
  id: string;
  reservationId: string;
  varietyName: string;
  typeName: string;
  quantity: number;
  pricePerTree: number;
  createdAt: string;
}

class ReservationService {
  async createReservation(
    userId: string | null,
    data: CreateReservationData
  ): Promise<{ reservation: Reservation; items: ReservationItem[] } | null> {
    try {
      const treeTypes = Array.from(
        new Set(Object.values(data.cart).map(item => item.typeName))
      ).join('، ');

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: userId,
          farm_id: data.farmId,
          farm_name: data.farmName,
          total_trees: data.totalTrees,
          total_price: data.totalPrice,
          contract_id: data.contractId || null,
          contract_name: data.contractName || null,
          duration_years: data.durationYears || 1,
          bonus_years: data.bonusYears || 0,
          tree_details: data.treeDetails || [],
          tree_types: treeTypes,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (reservationError || !reservation) {
        console.error('Error creating reservation:', reservationError);
        return null;
      }

      const items = Object.values(data.cart).map(item => ({
        reservation_id: reservation.id,
        variety_name: item.varietyName,
        type_name: item.typeName,
        quantity: item.quantity,
        price_per_tree: item.price
      }));

      const { data: reservationItems, error: itemsError } = await supabase
        .from('reservation_items')
        .insert(items)
        .select();

      if (itemsError || !reservationItems) {
        console.error('Error creating reservation items:', itemsError);
        await supabase.from('reservations').delete().eq('id', reservation.id);
        return null;
      }

      return {
        reservation: this.mapReservation(reservation),
        items: reservationItems.map(this.mapReservationItem)
      };
    } catch (error) {
      console.error('Error in createReservation:', error);
      return null;
    }
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reservations:', error);
        return [];
      }

      return data ? data.map(this.mapReservation) : [];
    } catch (error) {
      console.error('Error in getUserReservations:', error);
      return [];
    }
  }

  async getReservationItems(reservationId: string): Promise<ReservationItem[]> {
    try {
      const { data, error } = await supabase
        .from('reservation_items')
        .select('*')
        .eq('reservation_id', reservationId);

      if (error) {
        console.error('Error fetching reservation items:', error);
        return [];
      }

      return data ? data.map(this.mapReservationItem) : [];
    } catch (error) {
      console.error('Error in getReservationItems:', error);
      return [];
    }
  }

  async getReservationWithItems(reservationId: string): Promise<{
    reservation: Reservation;
    items: ReservationItem[];
  } | null> {
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .maybeSingle();

      if (reservationError || !reservation) {
        console.error('Error fetching reservation:', reservationError);
        return null;
      }

      const items = await this.getReservationItems(reservationId);

      return {
        reservation: this.mapReservation(reservation),
        items
      };
    } catch (error) {
      console.error('Error in getReservationWithItems:', error);
      return null;
    }
  }

  async updateReservationStatus(
    reservationId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId);

      if (error) {
        console.error('Error updating reservation status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateReservationStatus:', error);
      return false;
    }
  }

  async linkReservationToUser(
    reservationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ user_id: userId })
        .eq('id', reservationId);

      if (error) {
        console.error('Error linking reservation to user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in linkReservationToUser:', error);
      return false;
    }
  }

  async getPendingReservationsForUser(userId: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending reservations:', error);
        return [];
      }

      return data ? data.map(this.mapReservation) : [];
    } catch (error) {
      console.error('Error in getPendingReservationsForUser:', error);
      return [];
    }
  }

  async savePendingReservationFromStorage(userId: string): Promise<boolean> {
    try {
      const pendingDataStr = localStorage.getItem('pendingReservation');
      if (!pendingDataStr) {
        console.log('No pending reservation found in localStorage');
        return false;
      }

      const pendingData = JSON.parse(pendingDataStr);

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: userId,
          farm_id: pendingData.farmId,
          farm_name: pendingData.farmName,
          total_trees: pendingData.totalTrees,
          total_price: pendingData.totalPrice,
          contract_id: pendingData.contractId || null,
          contract_name: pendingData.contractName || null,
          duration_years: pendingData.durationYears || 1,
          bonus_years: pendingData.bonusYears || 0,
          tree_details: pendingData.treeDetails || [],
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (reservationError || !reservation) {
        console.error('Error creating reservation:', reservationError);
        return false;
      }

      const items = Object.values(pendingData.cart).map((item: any) => ({
        reservation_id: reservation.id,
        variety_name: item.varietyName,
        type_name: item.typeName,
        quantity: item.quantity,
        price_per_tree: item.price
      }));

      const { error: itemsError } = await supabase
        .from('reservation_items')
        .insert(items);

      if (itemsError) {
        console.error('Error creating reservation items:', itemsError);
        await supabase.from('reservations').delete().eq('id', reservation.id);
        return false;
      }

      localStorage.removeItem('pendingReservation');
      console.log('Pending reservation saved successfully');
      return true;
    } catch (error) {
      console.error('Error in savePendingReservationFromStorage:', error);
      return false;
    }
  }

  private mapReservation(data: any): Reservation {
    return {
      id: data.id,
      userId: data.user_id,
      farmId: data.farm_id,
      farmName: data.farm_name,
      totalTrees: data.total_trees,
      totalPrice: parseFloat(data.total_price),
      status: data.status,
      contractId: data.contract_id,
      contractName: data.contract_name,
      durationYears: data.duration_years,
      bonusYears: data.bonus_years,
      treeDetails: data.tree_details || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapReservationItem(data: any): ReservationItem {
    return {
      id: data.id,
      reservationId: data.reservation_id,
      varietyName: data.variety_name,
      typeName: data.type_name,
      quantity: data.quantity,
      pricePerTree: parseFloat(data.price_per_tree),
      createdAt: data.created_at
    };
  }
}

export const reservationService = new ReservationService();
