/*
  # Insert Sample Data for Retail Execution Audit System

  This migration adds sample data to demonstrate the system functionality:
  - Sample stores
  - Sample products
  - Sample audit templates with conditional logic
  - Sample audit assignments
  - Sample dashboard widgets
  - Sample notifications
*/

-- Insert sample stores
INSERT INTO stores (store_code, store_name, address, city, state, postal_code, store_type, chain_name, contact_person, contact_phone, coordinates) VALUES
('ST001', 'Metro Superstore - Downtown', '123 Main Street, Downtown Area', 'Mumbai', 'Maharashtra', '400001', 'Supermarket', 'Metro Chain', 'Rajesh Kumar', '+91-9876543210', '{"lat": 19.0760, "lng": 72.8777}'),
('ST002', 'Fresh Market - Uptown', '456 Oak Avenue, Uptown District', 'Mumbai', 'Maharashtra', '400002', 'Hypermarket', 'Fresh Chain', 'Priya Sharma', '+91-9876543211', '{"lat": 19.0896, "lng": 72.8656}'),
('ST003', 'QuickMart - Midtown', '789 Pine Street, Midtown', 'Mumbai', 'Maharashtra', '400003', 'Convenience Store', 'Quick Chain', 'Amit Patel', '+91-9876543212', '{"lat": 19.0728, "lng": 72.8826}'),
('ST004', 'Corner Store - Westside', '321 Elm Road, Westside', 'Mumbai', 'Maharashtra', '400004', 'Local Store', 'Independent', 'Sunita Reddy', '+91-9876543213', '{"lat": 19.0544, "lng": 72.8320}'),
('ST005', 'Big Bazaar - Central', '654 Central Plaza, Central Mumbai', 'Mumbai', 'Maharashtra', '400005', 'Hypermarket', 'Big Bazaar Chain', 'Vikram Singh', '+91-9876543214', '{"lat": 19.0176, "lng": 72.8562}')
ON CONFLICT (store_code) DO NOTHING;

-- Insert sample products
INSERT INTO products (product_code, product_name, brand, category, subcategory, mrp, pack_size, barcode, description) VALUES
('PRD001', 'Premium Tea Bags', 'TeaMaster', 'Beverages', 'Tea', 125.00, '100 Bags', '8901234567890', 'Premium quality tea bags with rich flavor'),
('PRD002', 'Instant Coffee Powder', 'CoffeePlus', 'Beverages', 'Coffee', 89.50, '50g Jar', '8901234567891', 'Rich and aromatic instant coffee powder'),
('PRD003', 'Whole Wheat Biscuits', 'HealthyBite', 'Snacks', 'Biscuits', 45.00, '200g Pack', '8901234567892', 'Nutritious whole wheat biscuits'),
('PRD004', 'Coconut Oil', 'PureOil', 'Cooking', 'Oil', 180.00, '500ml Bottle', '8901234567893', '100% pure coconut oil for cooking'),
('PRD005', 'Basmati Rice', 'GrainMaster', 'Staples', 'Rice', 320.00, '1kg Pack', '8901234567894', 'Premium quality basmati rice'),
('PRD006', 'Hand Sanitizer', 'CleanHands', 'Personal Care', 'Hygiene', 65.00, '100ml Bottle', '8901234567895', 'Alcohol-based hand sanitizer'),
('PRD007', 'Face Mask Pack', 'SafeGuard', 'Personal Care', 'Protection', 25.00, '5 Pieces', '8901234567896', 'Disposable face masks for protection'),
('PRD008', 'Energy Drink', 'PowerBoost', 'Beverages', 'Energy Drinks', 55.00, '250ml Can', '8901234567897', 'Energy drink with vitamins and minerals')
ON CONFLICT (product_code) DO NOTHING;

-- Insert sample audit templates with conditional logic
DO $$
DECLARE
    merchandising_category_id uuid;
    stock_category_id uuid;
    admin_user_id uuid;
BEGIN
    -- Get category IDs
    SELECT category_id INTO merchandising_category_id FROM template_categories WHERE name = 'Merchandising' LIMIT 1;
    SELECT category_id INTO stock_category_id FROM template_categories WHERE name = 'Stock Management' LIMIT 1;
    
    -- Get admin user ID (if exists)
    SELECT user_id INTO admin_user_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
    
    -- Insert comprehensive store audit template
    IF merchandising_category_id IS NOT NULL THEN
        INSERT INTO audit_templates (name, description, category_id, sections, conditional_logic, scoring_rules, created_by, is_published) VALUES
        (
          'Comprehensive Store Audit',
          'Complete store audit covering availability, visibility, pricing, and compliance',
          merchandising_category_id,
          jsonb_build_array(
            jsonb_build_object(
              'section_id', 'availability',
              'title', 'Product Availability',
              'description', 'Check product availability and stock levels',
              'order_index', 1,
              'questions', jsonb_build_array(
                jsonb_build_object(
                  'question_id', 'q1',
                  'text', 'Is our product available on the shelf?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Yes', 'No'),
                  'validation', jsonb_build_object('mandatory', true)
                ),
                jsonb_build_object(
                  'question_id', 'q1_followup',
                  'text', 'Why is the product unavailable?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('No stock', 'Not ordered', 'Delisted', 'Other'),
                  'validation', jsonb_build_object('mandatory', true),
                  'conditional', jsonb_build_object('show_when', jsonb_build_object('q1', 'No'))
                ),
                jsonb_build_object(
                  'question_id', 'q2',
                  'text', 'Estimate the stock quantity on display',
                  'type', 'numeric',
                  'validation', jsonb_build_object('mandatory', true, 'min_value', 0)
                ),
                jsonb_build_object(
                  'question_id', 'q2_followup',
                  'text', 'Did you inform store staff to replenish?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Yes', 'No', 'Staff not available'),
                  'validation', jsonb_build_object('mandatory', true),
                  'conditional', jsonb_build_object('show_when', jsonb_build_object('q2', '<=5'))
                ),
                jsonb_build_object(
                  'question_id', 'q3',
                  'text', 'Upload a photo of the product shelf',
                  'type', 'file_upload',
                  'validation', jsonb_build_object('mandatory', false)
                )
              )
            ),
            jsonb_build_object(
              'section_id', 'visibility',
              'title', 'Shelf Visibility',
              'description', 'Assess product placement and visibility',
              'order_index', 2,
              'questions', jsonb_build_array(
                jsonb_build_object(
                  'question_id', 'q4',
                  'text', 'Is the product placed at eye level or in a prime location?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Eye Level', 'Mid-shelf', 'Bottom Shelf'),
                  'validation', jsonb_build_object('mandatory', true)
                ),
                jsonb_build_object(
                  'question_id', 'q4_followup',
                  'text', 'Can the product be moved to a better shelf?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Yes', 'No', 'Need permission'),
                  'validation', jsonb_build_object('mandatory', true),
                  'conditional', jsonb_build_object('show_when', jsonb_build_object('q4', 'Bottom Shelf'))
                ),
                jsonb_build_object(
                  'question_id', 'q5',
                  'text', 'How many facings does our product have?',
                  'type', 'numeric',
                  'validation', jsonb_build_object('mandatory', true, 'min_value', 1)
                ),
                jsonb_build_object(
                  'question_id', 'q6',
                  'text', 'Is our POSM (posters, wobblers, shelf strips) properly placed and visible?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Yes', 'No', 'Partially'),
                  'validation', jsonb_build_object('mandatory', true)
                )
              )
            ),
            jsonb_build_object(
              'section_id', 'competition',
              'title', 'Competitor Analysis',
              'description', 'Track competitor products and pricing',
              'order_index', 3,
              'questions', jsonb_build_array(
                jsonb_build_object(
                  'question_id', 'q7',
                  'text', 'Which competitor products are present next to ours?',
                  'type', 'multiple_choice',
                  'options', jsonb_build_array('Brand A', 'Brand B', 'Brand C', 'Brand D', 'None'),
                  'validation', jsonb_build_object('mandatory', true)
                ),
                jsonb_build_object(
                  'question_id', 'q7_followup1',
                  'text', 'Are those competitor products on promotion?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Yes', 'No', 'Some of them'),
                  'validation', jsonb_build_object('mandatory', true),
                  'conditional', jsonb_build_object('show_when', jsonb_build_object('q7', 'not_contains:None'))
                ),
                jsonb_build_object(
                  'question_id', 'q7_followup2',
                  'text', 'Note competitor prices (separate multiple prices with commas)',
                  'type', 'text',
                  'validation', jsonb_build_object('mandatory', false),
                  'conditional', jsonb_build_object('show_when', jsonb_build_object('q7', 'not_contains:None'))
                ),
                jsonb_build_object(
                  'question_id', 'q8',
                  'text', 'Is the product being sold at the correct MRP?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Yes', 'No - Higher', 'No - Lower'),
                  'validation', jsonb_build_object('mandatory', true)
                ),
                jsonb_build_object(
                  'question_id', 'q8_followup',
                  'text', 'Enter the actual selling price displayed',
                  'type', 'numeric',
                  'validation', jsonb_build_object('mandatory', true, 'min_value', 0),
                  'conditional', jsonb_build_object('show_when', jsonb_build_object('q8', 'not_equals:Yes'))
                ),
                jsonb_build_object(
                  'question_id', 'q9',
                  'text', 'Rate the overall cleanliness of the outlet',
                  'type', 'single_choice',
                  'options', jsonb_build_array('1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'),
                  'validation', jsonb_build_object('mandatory', true)
                )
              )
            )
          ),
          jsonb_build_object(
            'rules', jsonb_build_array(
              jsonb_build_object(
                'id', 'availability_followup',
                'condition', jsonb_build_object('question_id', 'q1', 'operator', 'equals', 'value', 'No'),
                'action', jsonb_build_object('type', 'show_question', 'target', 'q1_followup')
              ),
              jsonb_build_object(
                'id', 'stock_replenish',
                'condition', jsonb_build_object('question_id', 'q2', 'operator', 'less_than_or_equal', 'value', 5),
                'action', jsonb_build_object('type', 'show_question', 'target', 'q2_followup')
              ),
              jsonb_build_object(
                'id', 'shelf_placement',
                'condition', jsonb_build_object('question_id', 'q4', 'operator', 'equals', 'value', 'Bottom Shelf'),
                'action', jsonb_build_object('type', 'show_question', 'target', 'q4_followup')
              ),
              jsonb_build_object(
                'id', 'competitor_promotion',
                'condition', jsonb_build_object('question_id', 'q7', 'operator', 'not_contains', 'value', 'None'),
                'action', jsonb_build_object('type', 'show_question', 'target', 'q7_followup1')
              ),
              jsonb_build_object(
                'id', 'competitor_prices',
                'condition', jsonb_build_object('question_id', 'q7', 'operator', 'not_contains', 'value', 'None'),
                'action', jsonb_build_object('type', 'show_question', 'target', 'q7_followup2')
              ),
              jsonb_build_object(
                'id', 'price_verification',
                'condition', jsonb_build_object('question_id', 'q8', 'operator', 'not_equals', 'value', 'Yes'),
                'action', jsonb_build_object('type', 'show_question', 'target', 'q8_followup')
              )
            )
          ),
          jsonb_build_object(
            'weights', jsonb_build_object(
              'availability', 40,
              'visibility', 35,
              'competition', 25
            ),
            'threshold', 80,
            'critical_questions', jsonb_build_array('q1', 'q4', 'q8'),
            'scoring_method', 'weighted_average'
          ),
          admin_user_id,
          true
        )
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    -- Insert quick stock check template
    IF stock_category_id IS NOT NULL THEN
        INSERT INTO audit_templates (name, description, category_id, sections, conditional_logic, scoring_rules, created_by, is_published) VALUES
        (
          'Quick Stock Check',
          'Fast stock availability and pricing verification',
          stock_category_id,
          jsonb_build_array(
            jsonb_build_object(
              'section_id', 'stock_check',
              'title', 'Stock Verification',
              'description', 'Quick stock and pricing check',
              'order_index', 1,
              'questions', jsonb_build_array(
                jsonb_build_object(
                  'question_id', 'sq1',
                  'text', 'Product availability status',
                  'type', 'single_choice',
                  'options', jsonb_build_array('In Stock', 'Out of Stock', 'Low Stock'),
                  'validation', jsonb_build_object('mandatory', true)
                ),
                jsonb_build_object(
                  'question_id', 'sq2',
                  'text', 'Current stock quantity (approximate)',
                  'type', 'numeric',
                  'validation', jsonb_build_object('mandatory', true, 'min_value', 0)
                ),
                jsonb_build_object(
                  'question_id', 'sq3',
                  'text', 'Price displayed matches MRP?',
                  'type', 'single_choice',
                  'options', jsonb_build_array('Yes', 'No'),
                  'validation', jsonb_build_object('mandatory', true)
                ),
                jsonb_build_object(
                  'question_id', 'sq4',
                  'text', 'Take a quick photo of the product',
                  'type', 'file_upload',
                  'validation', jsonb_build_object('mandatory', false)
                )
              )
            )
          ),
          jsonb_build_object(),
          jsonb_build_object(
            'weights', jsonb_build_object('stock_check', 100),
            'threshold', 75,
            'critical_questions', jsonb_build_array('sq1', 'sq3'),
            'scoring_method', 'simple'
          ),
          admin_user_id,
          true
        )
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- Insert sample audit assignments
DO $$
DECLARE
    comprehensive_template_id uuid;
    quick_template_id uuid;
    store1_id uuid;
    store2_id uuid;
    store3_id uuid;
    auditor_user_id uuid;
    supervisor_user_id uuid;
BEGIN
    -- Get template IDs
    SELECT template_id INTO comprehensive_template_id FROM audit_templates WHERE name = 'Comprehensive Store Audit' LIMIT 1;
    SELECT template_id INTO quick_template_id FROM audit_templates WHERE name = 'Quick Stock Check' LIMIT 1;
    
    -- Get store IDs
    SELECT store_id INTO store1_id FROM stores WHERE store_code = 'ST001';
    SELECT store_id INTO store2_id FROM stores WHERE store_code = 'ST002';
    SELECT store_id INTO store3_id FROM stores WHERE store_code = 'ST003';
    
    -- Get user IDs
    SELECT user_id INTO auditor_user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1;
    SELECT user_id INTO supervisor_user_id FROM user_profiles WHERE role = 'supervisor' LIMIT 1;
    
    -- Insert assignments only if we have all required data
    IF comprehensive_template_id IS NOT NULL AND store1_id IS NOT NULL AND auditor_user_id IS NOT NULL AND supervisor_user_id IS NOT NULL THEN
        INSERT INTO audit_assignments (template_id, store_id, assigned_to, assigned_by, due_date, priority, instructions) VALUES
        (
          comprehensive_template_id,
          store1_id,
          auditor_user_id,
          supervisor_user_id,
          (CURRENT_DATE + INTERVAL '3 days'),
          'high',
          'Please complete this audit by end of week. Focus on new product placements and competitor analysis.'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF quick_template_id IS NOT NULL AND store2_id IS NOT NULL AND auditor_user_id IS NOT NULL AND supervisor_user_id IS NOT NULL THEN
        INSERT INTO audit_assignments (template_id, store_id, assigned_to, assigned_by, due_date, priority, instructions) VALUES
        (
          quick_template_id,
          store2_id,
          auditor_user_id,
          supervisor_user_id,
          (CURRENT_DATE + INTERVAL '1 day'),
          'medium',
          'Quick check for stock levels before weekend rush.'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF comprehensive_template_id IS NOT NULL AND store3_id IS NOT NULL AND auditor_user_id IS NOT NULL AND supervisor_user_id IS NOT NULL THEN
        INSERT INTO audit_assignments (template_id, store_id, assigned_to, assigned_by, due_date, priority, instructions) VALUES
        (
          comprehensive_template_id,
          store3_id,
          auditor_user_id,
          supervisor_user_id,
          (CURRENT_DATE + INTERVAL '5 days'),
          'medium',
          'Regular monthly audit. Pay attention to POSM compliance.'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample dashboard widgets configuration
DO $$
DECLARE
    admin_user_id uuid;
    auditor_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT user_id INTO admin_user_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
    SELECT user_id INTO auditor_user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1;
    
    -- Insert admin widgets
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO dashboard_widgets (user_id, widget_type, title, configuration, position) VALUES
        (
          admin_user_id,
          'audit_summary',
          'Audit Overview',
          jsonb_build_object('show_pending', true, 'show_completed', true, 'time_period', 'week'),
          jsonb_build_object('x', 0, 'y', 0, 'width', 6, 'height', 4)
        ),
        (
          admin_user_id,
          'compliance_chart',
          'Compliance Trends',
          jsonb_build_object('chart_type', 'line', 'time_period', 'month'),
          jsonb_build_object('x', 6, 'y', 0, 'width', 6, 'height', 4)
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Insert auditor widgets
    IF auditor_user_id IS NOT NULL THEN
        INSERT INTO dashboard_widgets (user_id, widget_type, title, configuration, position) VALUES
        (
          auditor_user_id,
          'my_audits',
          'My Assigned Audits',
          jsonb_build_object('show_due_today', true, 'show_overdue', true),
          jsonb_build_object('x', 0, 'y', 0, 'width', 12, 'height', 6)
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert sample notifications
DO $$
DECLARE
    auditor_user_id uuid;
    supervisor_user_id uuid;
    sample_assignment_id uuid;
BEGIN
    -- Get user IDs
    SELECT user_id INTO auditor_user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1;
    SELECT user_id INTO supervisor_user_id FROM user_profiles WHERE role = 'supervisor' LIMIT 1;
    SELECT assignment_id INTO sample_assignment_id FROM audit_assignments LIMIT 1;
    
    -- Insert auditor notification
    IF auditor_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, category, data) VALUES
        (
          auditor_user_id,
          'New Audit Assignment',
          'You have been assigned a new audit at Metro Superstore - Downtown. Due date: ' || (CURRENT_DATE + INTERVAL '3 days')::text,
          'info',
          'assignment',
          CASE 
            WHEN sample_assignment_id IS NOT NULL THEN jsonb_build_object('assignment_id', sample_assignment_id)
            ELSE jsonb_build_object()
          END
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Insert supervisor notification
    IF supervisor_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, category, data) VALUES
        (
          supervisor_user_id,
          'Audit Completed',
          'Audit at Fresh Market - Uptown has been completed and is ready for review.',
          'success',
          'audit',
          jsonb_build_object()
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;