import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Running auto-cancel-orders job...');

    // Find orders that should be auto-cancelled
    // Cancel if harvest_date + 7 days has passed and order is still pending
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: ordersToCancel, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        products!inner (harvest_date)
      `)
      .in('status', ['pending', 'confirmed'])
      .lt('products.harvest_date', sevenDaysAgo.toISOString().split('T')[0]);

    if (fetchError) {
      console.error('Error fetching orders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${ordersToCancel?.length || 0} orders to cancel`);

    // Cancel each order
    for (const order of ordersToCancel || []) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Auto-cancelled: Exceeded 7 days after harvest date',
        })
        .eq('id', order.id);

      if (updateError) {
        console.error(`Error cancelling order ${order.id}:`, updateError);
        continue;
      }

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: 'Order Cancelled',
        message: 'Your order was automatically cancelled as it exceeded the pickup window.',
        type: 'order_cancelled',
        related_order_id: order.id,
      });

      console.log(`Cancelled order ${order.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cancelled ${ordersToCancel?.length || 0} orders`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-cancel-orders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
