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

    console.log('Running check-farm-confirm job...');

    // Find pending orders older than 48 hours
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id, farm_id')
      .eq('status', 'pending')
      .lt('created_at', twoDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching orders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredOrders?.length || 0} unconfirmed orders`);

    // Cancel each expired order
    for (const order of expiredOrders || []) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Farm did not confirm within 48 hours',
        })
        .eq('id', order.id);

      if (updateError) {
        console.error(`Error cancelling order ${order.id}:`, updateError);
        continue;
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: 'Order Cancelled',
        message: 'Your order was cancelled as the farm did not confirm within 48 hours.',
        type: 'order_cancelled',
        related_order_id: order.id,
      });

      // Notify farm
      await supabase.from('notifications').insert({
        user_id: order.farm_id,
        title: 'Missed Confirmation',
        message: 'An order was auto-cancelled due to no confirmation within 48 hours.',
        type: 'confirmation_missed',
        related_order_id: order.id,
      });

      console.log(`Cancelled unconfirmed order ${order.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cancelled ${expiredOrders?.length || 0} unconfirmed orders`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-farm-confirm:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
