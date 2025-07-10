/*
  # Insert Sample Data for Retail Execution Audit System

  This migration adds sample data to demonstrate the system functionality:
  - Sample stores
  - Sample products
  - Sample audit templates with conditional logic
  - Sample user profiles
  - Sample audit assignments
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

-- Insert sample audit template with conditional logic
INSERT INTO audit_templates (name, description, category_id, sections, conditional_logic, scoring_rules, created_by, is_published) VALUES
(
  'Comprehensive Store Audit',
  'Complete store audit covering availability, visibility, pricing, and compliance',
  (SELECT category_id FROM template_categories WHERE name = 'Merchandising'),
  '[
    {
      "section_id": "availability",
      "title": "Product Availability",
      "description": "Check product availability and stock levels",
      "order_index": 1,
      "questions": [
        {
          "question_id": "q1",
          "text": "Is our product available on the shelf?",
          "type": "single_choice",
          "options": ["Yes", "No"],
          "validation": {"mandatory": true}
        },
        {
          "question_id": "q1_followup",
          "text": "Why is the product unavailable?",
          "type": "single_choice",
          "options": ["No stock", "Not ordered", "Delisted", "Other"],
          "validation": {"mandatory": true},
          "conditional": {
            "show_when": {"q1": "No"}
          }
        },
        {
          "question_id": "q2",
          "text": "Estimate the stock quantity on display",
          "type": "numeric",
          "validation": {"mandatory": true, "min_value": 0}
        },
        {
          "question_id": "q2_followup",
          "text": "Did you inform store staff to replenish?",
          "type": "single_choice",
          "options": ["Yes", "No", "Staff not available"],
          "validation": {"mandatory": true},
          "conditional": {
            "show_when": {"q2": "<=5"}
          }
        },
        {
          "question_id": "q3",
          "text": "Upload a photo of the product shelf",
          "type": "file_upload",
          "validation": {"mandatory": false}
        }
      ]
    },
    {
      "section_id": "visibility",
      "title": "Shelf Visibility",
      "description": "Assess product placement and visibility",
      "order_index": 2,
      "questions": [
        {
          "question_id": "q4",
          "text": "Is the product placed at eye level or in a prime location?",
          "type": "single_choice",
          "options": ["Eye Level", "Mid-shelf", "Bottom Shelf"],
          "validation": {"mandatory": true}
        },
        {
          "question_id": "q4_followup",
          "text": "Can the product be moved to a better shelf?",
          "type": "single_choice",
          "options": ["Yes", "No", "Need permission"],
          "validation": {"mandatory": true},
          "conditional": {
            "show_when": {"q4": "Bottom Shelf"}
          }
        },
        {
          "question_id": "q5",
          "text": "How many facings does our product have?",
          "type": "numeric",
          "validation": {"mandatory": true, "min_value": 1}
        },
        {
          "question_id": "q6",
          "text": "Is our POSM (posters, wobblers, shelf strips) properly placed and visible?",
          "type": "single_choice",
          "options": ["Yes", "No", "Partially"],
          "validation": {"mandatory": true}
        }
      ]
    },
    {
      "section_id": "competition",
      "title": "Competitor Analysis",
      "description": "Track competitor products and pricing",
      "order_index": 3,
      "questions": [
        {
          "question_id": "q7",
          "text": "Which competitor products are present next to ours?",
          "type": "multiple_choice",
          "options": ["Brand A", "Brand B", "Brand C", "Brand D", "None"],
          "validation": {"mandatory": true}
        },
        {
          "question_id": "q7_followup1",
          "text": "Are those competitor products on promotion?",
          "type": "single_choice",
          "options": ["Yes", "No", "Some of them"],
          "validation": {"mandatory": true},
          "conditional": {
            "show_when": {"q7": "not_contains:None"}
          }
        },
        {
          "question_id": "q7_followup2",
          "text": "Note competitor prices (separate multiple prices with commas)",
          "type": "text",
          "validation": {"mandatory": false},
          "conditional": {
            "show_when": {"q7": "not_contains:None"}
          }
        },
        {
          "question_id": "q8",
          "text": "Is the product being sold at the correct MRP?",
          "type": "single_choice",
          "options": ["Yes", "No - Higher", "No - Lower"],
          "validation": {"mandatory": true}
        },
        {
          "question_id": "q8_followup",
          "text": "Enter the actual selling price displayed",
          "type": "numeric",
          "validation": {"mandatory": true, "min_value": 0},
          "conditional": {
            "show_when": {"q8": "not_equals:Yes"}
          }
        },
        {
          "question_id": "q9",
          "text": "Rate the overall cleanliness of the outlet",
          "type": "single_choice",
          "options": ["1 - Poor", "2 - Fair", "3 - Good", "4 - Very Good", "5 - Excellent"],
          "validation": {"mandatory": true}
        }
      ]
    }
  ]'::jsonb,
  '{
    "rules": [
      {
        "id": "availability_followup",
        "condition": {"question_id": "q1", "operator": "equals", "value": "No"},
        "action": {"type": "show_question", "target": "q1_followup"}
      },
      {
        "id": "stock_replenish",
        "condition": {"question_id": "q2", "operator": "less_than_or_equal", "value": 5},
        "action": {"type": "show_question", "target": "q2_followup"}
      },
      {
        "id": "shelf_placement",
        "condition": {"question_id": "q4", "operator": "equals", "value": "Bottom Shelf"},
        "action": {"type": "show_question", "target": "q4_followup"}
      },
      {
        "id": "competitor_promotion",
        "condition": {"question_id": "q7", "operator": "not_contains", "value": "None"},
        "action": {"type": "show_question", "target": "q7_followup1"}
      },
      {
        "id": "competitor_prices",
        "condition": {"question_id": "q7", "operator": "not_contains", "value": "None"},
        "action": {"type": "show_question", "target": "q7_followup2"}
      },
      {
        "id": "price_verification",
        "condition": {"question_id": "q8", "operator": "not_equals", "value": "Yes"},
        "action": {"type": "show_question", "target": "q8_followup"}
      }
    ]
  }'::jsonb,
  '{
    "weights": {
      "availability": 40,
      "visibility": 35,
      "competition": 25
    },
    "threshold": 80,
    "critical_questions": ["q1", "q4", "q8"],
    "scoring_method": "weighted_average"
  }'::jsonb,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true
),
(
  'Quick Stock Check',
  'Fast stock availability and pricing verification',
  (SELECT category_id FROM template_categories WHERE name = 'Stock Management'),
  '[
    {
      "section_id": "stock_check",
      "title": "Stock Verification",
      "description": "Quick stock and pricing check",
      "order_index": 1,
      "questions": [
        {
          "question_id": "sq1",
          "text": "Product availability status",
          "type": "single_choice",
          "options": ["In Stock", "Out of Stock", "Low Stock"],
          "validation": {"mandatory": true}
        },
        {
          "question_id": "sq2",
          "text": "Current stock quantity (approximate)",
          "type": "numeric",
          "validation": {"mandatory": true, "min_value": 0}
        },
        {
          "question_id": "sq3",
          "text": "Price displayed matches MRP?",
          "type": "single_choice",
          "options": ["Yes", "No"],
          "validation": {"mandatory": true}
        },
        {
          "question_id": "sq4",
          "text": "Take a quick photo of the product",
          "type": "file_upload",
          "validation": {"mandatory": false}
        }
      ]
    }
  ]'::jsonb,
  '{}'::jsonb,
  '{
    "weights": {"stock_check": 100},
    "threshold": 75,
    "critical_questions": ["sq1", "sq3"],
    "scoring_method": "simple"
  }'::jsonb,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true
)
ON CONFLICT DO NOTHING;

-- Insert sample audit assignments
INSERT INTO audit_assignments (template_id, store_id, assigned_to, assigned_by, due_date, priority, instructions) VALUES
(
  (SELECT template_id FROM audit_templates WHERE name = 'Comprehensive Store Audit' LIMIT 1),
  (SELECT store_id FROM stores WHERE store_code = 'ST001'),
  (SELECT user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1),
  (SELECT user_id FROM user_profiles WHERE role = 'supervisor' LIMIT 1),
  (CURRENT_DATE + INTERVAL '3 days'),
  'high',
  'Please complete this audit by end of week. Focus on new product placements and competitor analysis.'
),
(
  (SELECT template_id FROM audit_templates WHERE name = 'Quick Stock Check' LIMIT 1),
  (SELECT store_id FROM stores WHERE store_code = 'ST002'),
  (SELECT user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1),
  (SELECT user_id FROM user_profiles WHERE role = 'supervisor' LIMIT 1),
  (CURRENT_DATE + INTERVAL '1 day'),
  'medium',
  'Quick check for stock levels before weekend rush.'
),
(
  (SELECT template_id FROM audit_templates WHERE name = 'Comprehensive Store Audit' LIMIT 1),
  (SELECT store_id FROM stores WHERE store_code = 'ST003'),
  (SELECT user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1),
  (SELECT user_id FROM user_profiles WHERE role = 'supervisor' LIMIT 1),
  (CURRENT_DATE + INTERVAL '5 days'),
  'medium',
  'Regular monthly audit. Pay attention to POSM compliance.'
)
ON CONFLICT DO NOTHING;

-- Insert sample dashboard widgets configuration
INSERT INTO dashboard_widgets (user_id, widget_type, title, configuration, position) VALUES
(
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  'audit_summary',
  'Audit Overview',
  '{"show_pending": true, "show_completed": true, "time_period": "week"}',
  '{"x": 0, "y": 0, "width": 6, "height": 4}'
),
(
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  'compliance_chart',
  'Compliance Trends',
  '{"chart_type": "line", "time_period": "month"}',
  '{"x": 6, "y": 0, "width": 6, "height": 4}'
),
(
  (SELECT user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1),
  'my_audits',
  'My Assigned Audits',
  '{"show_due_today": true, "show_overdue": true}',
  '{"x": 0, "y": 0, "width": 12, "height": 6}'
)
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, category, data) VALUES
(
  (SELECT user_id FROM user_profiles WHERE role = 'auditor' LIMIT 1),
  'New Audit Assignment',
  'You have been assigned a new audit at Metro Superstore - Downtown. Due date: ' || (CURRENT_DATE + INTERVAL '3 days')::text,
  'info',
  'assignment',
  '{"assignment_id": "' || (SELECT assignment_id FROM audit_assignments LIMIT 1) || '"}'
),
(
  (SELECT user_id FROM user_profiles WHERE role = 'supervisor' LIMIT 1),
  'Audit Completed',
  'Audit at Fresh Market - Uptown has been completed and is ready for review.',
  'success',
  'audit',
  '{}'
)
ON CONFLICT DO NOTHING;