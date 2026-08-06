Rails.application.routes.draw do




  get 'maintenance/index/:first'  => 'maintenance#index'
  post 'maintenance/index/:first'  => 'maintenance#index'
  get 'restore/index'
  post 'admin_menu/index/:first' => 'admin_menu#index'
    get 'admin_menu/index/:first' => 'admin_menu#index'
  get 'jiseki_toroku_kanryo/index'

  get 'jiseki_toroku/index'

  get 'yotei_admin/index'

  get 'monthlist/index'

#	get 'tasks', :to => 'tasks#index', :as => :user_root  
	
	
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end



  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable
 # root :to => 'index#index'
 root 'index#index'
 post 'index/index'
 get  'index/index'
 get  'index/sql1'
 get  'hello/special'
 post 'hello/special'    
 
 post 'admin_login/index'  => 'admin_login#index'
 get  'admin_login/index'  => 'admin_login#index'
 post 'admin_login/error'
  post 'admin_login/commit'
 
 post 'tenken_login/index'
 get  'tenken_login/index'
 post 'tenken_login/error'
 
 post 'admin_menu/index'
 get  'admin_menu/index'

 post 'tenken_toroku/index'
 get  'tenken_toroku/index'
 post 'tenken_toroku/commit'

 post 'tenken_henko_sakujo/index'
 get  'tenken_henko_sakujo/index'
 post 'tenken_henko_sakujo/commit'
 get  'tenken_henko_sakujo/delete/:upper/:lower' => 'tenken_henko_sakujo#delete'
 post 'tenken_henko_sakujo/delete/:upper/:lower' => 'tenken_henko_sakujo#delete'

 
 post 'tenken_toroku_kanryo/index'
 post 'tenken_henko_kanryo/index'
 get  'tenken_henko_kanryo/index'
 post 'tenken_sakujo_kanryo/index'
 get  'tenken_sakujo_kanryo/index'
 
 
 post 'setsubilist/index'
 get  'setsubilist/index'
 post 'setsubilist/commit'

 post 'buken_toroku/index'
 get  'buken_toroku/index'
 get  'buken_toroku/index/:first/:second' => 'buken_toroku#index'
 #get  'buken_toroku_kanryo/index'
 
 post 'buken_kensaku/index'
 get  'buken_kensaku/index'

 get  'buken_joho_shosai/index'
 post 'buken_joho_shosai/index'
 get  'buken_joho_shosai/index/:first/:second' => 'buken_joho_shosai#index'
 
 post 'buken_joho_shosai/commit'
 
 post 'hachusha_kensaku/index'
 get  'hachusha_kensaku/index'
 get  'hachusha_kensaku/index/:first' => 'hachusha_kensaku#index'
 post 'buken_henko_sakujo/index'
 get  'buken_henko_sakujo/index/:first/:second' => 'buken_henko_sakujo#index'
 post 'buken_henko_sakujo/commit'
   
 get  'buken_henko_kanryo/delete/:first/:second/:third/:fourth' => 'buken_henko_kanryo#delete'
 get  'buken_henko_kanryo/:id/:first/:second' => 'buken_henko_kanryo#index'
 get  'buken_henko_kanryo/update_hachusha/:first' => 'buken_henko_kanryo#update_hachusha'
 get  'buken_henko_kanryo/update_buken/:first' => 'buken_henko_kanryo#update_buken'
 get  'buken_henko_kanryo/delete_tenken/:first' => 'buken_henko_kanryo#delete_tenken'
 get  'buken_henko_kanryo/stop_tenken/:first' => 'buken_henko_kanryo#stop_tenken'
 get  'buken_henko_kanryo/commit/:id/:first/:second' => 'buken_henko_kanryo#index'
 
 get  'buken_henko_kanryo/commit'
 post 'buken_henko_kanryo/commit'
 
 get  'yotei_admin/index/:first/:second/:third/:fourth/:fifth/:sixth' => 'yotei_admin#index'
 

 get 'jiseki_toroku/index/:id1'  => 'jiseki_toroku#index'
  
 get  'hoshurireki/index/:first/:second' => 'hoshurireki#index'
 post 'hoshurireki/index/:first/:second' => 'hoshurireki#index'
 
 get  'tantolist/index'
 post 'tantolist/index'
 get  'hachulist/index'
 post 'hachulist/index'
 post  'initialization/index'
 get  'initialization/index'
 get  'initialization/index/:first' => 'initialization#index'

 get  'admin_pass/index'
 post 'admin_pass/index'  
 post 'admin_pass/commit'  
 
  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
  # match ':controller(/:action(/:id(.:format)))'
  # match ':controller(/:action(/:id))(.:format)'
resources :index

resources :m_pwds
resources :m_checkpeoples
resources :m_checkpeople
resources :m_checkpersons
resources :m_kinds
get ':controller(/:action(/:id(.:format)))'
post ':controller(/:action(/:id(.:format)))'
get ':controller(/:action(/:id))(.:format)'
post ':controller(/:action(/:id))(.:format)'
 # match ':controller(/:action(/:id(.:format)))'
end
